//+------------------------------------------------------------------+
//|                                   TokyoRangeBreakoutEA.mq5       |
//|            Tokyo Range Breakout Expert Advisor for MT5            |
//|                                                                   |
//|  Strategy:                                                        |
//|    1. Identify the session high/low from 00:00-06:00 GMT.        |
//|    2. At 06:00 GMT place Buy Stop above and Sell Stop below.      |
//|    3. Cancel unfilled orders at 09:00 GMT.                        |
//|    4. Force-close all open trades at 12:00 GMT.                   |
//|                                                                   |
//|  Supported symbols: USDJPY, AUDJPY, AUDUSD                       |
//+------------------------------------------------------------------+
#property copyright   "Tokyo Range Breakout EA"
#property link        ""
#property version     "1.00"
#property description "Places breakout orders based on the Tokyo session range"

#include <Trade\Trade.mqh>

//=== Input Parameters =============================================

input group "=== Enabled Symbols ==="
input bool   Enable_USDJPY                 = true;
input bool   Enable_AUDJPY                 = true;
input bool   Enable_AUDUSD                 = true;

input group "=== GMT Time Windows ==="
input int    RangeStartHourGMT             = 0;   // Tokyo range starts (inclusive)
input int    RangeEndHourGMT               = 6;   // Tokyo range ends / orders placed here
input int    OrderCancelHourGMT            = 9;   // Cancel all unfilled pending orders
input int    ForceCloseHourGMT             = 12;  // Force-close all open trades
input int    BrokerGMTOffsetHours          = 0;   // Broker server offset from GMT (e.g. 2 for EET)

input group "=== Entry & Exit ==="
input double EntryBufferPips               = 3.0;  // Buffer added above/below range for pending entry
input double TakeProfitMultiplier          = 1.5;  // TP distance = range_width * this value
input bool   CancelOppositeOrderAfterEntry = false; // Cancel opposite pending order once one triggers

input group "=== Risk Management ==="
input double FixedLotSize                  = 0.10;
input bool   UseRiskPercent                = false;
input double RiskPercent                   = 1.0;  // % of balance to risk per trade
input double MaxSpreadPips                 = 2.5;  // Skip if spread exceeds this
input double MinRangePips                  = 10.0; // Skip if range narrower than this
input double MaxRangePips                  = 80.0; // Skip if range wider than this
input long   MagicNumber                   = 26062024;
input double SlippagePips                  = 2.0;

input group "=== Day Filters ==="
input bool   AllowMondayTrading            = true;
input bool   AllowFridayTrading            = true;

//=== Constants & Globals ==========================================

#define NUM_SYMBOLS 3

CTrade trade;

// Per-symbol daily state
struct SymbolState
{
   string   symbol;
   bool     enabled;

   // Range tracking
   double   rangeHigh;        // Highest ask seen during Tokyo window
   double   rangeLow;         // Lowest bid seen during Tokyo window
   bool     rangeCalculated;  // At least one tick was recorded

   // Order tracking
   bool     ordersPlacedToday;
   ulong    buyOrderTicket;
   ulong    sellOrderTicket;

   // Day tracking (GMT midnight timestamp)
   datetime currentGMTDay;
};

SymbolState g_States[NUM_SYMBOLS];

// Fixed list of tradable symbols — order must match Enable_ inputs
string g_AllowedSymbols[NUM_SYMBOLS] = {"USDJPY", "AUDJPY", "AUDUSD"};

//=== Initialisation ===============================================

int OnInit()
{
   // Slippage: modern brokers are 5-digit (non-JPY) / 3-digit (JPY),
   // both have 10 points per pip, so multiply by 10.
   trade.SetExpertMagicNumber((int)MagicNumber);
   trade.SetDeviationInPoints((int)(SlippagePips * 10));
   trade.SetAsyncMode(false);

   bool enabledFlags[NUM_SYMBOLS] = {Enable_USDJPY, Enable_AUDJPY, Enable_AUDUSD};
   int  activeCount = 0;

   for(int i = 0; i < NUM_SYMBOLS; i++)
   {
      g_States[i].symbol            = g_AllowedSymbols[i];
      g_States[i].enabled           = enabledFlags[i];
      g_States[i].rangeHigh         = 0.0;
      g_States[i].rangeLow          = DBL_MAX;
      g_States[i].rangeCalculated   = false;
      g_States[i].ordersPlacedToday = false;
      g_States[i].buyOrderTicket    = 0;
      g_States[i].sellOrderTicket   = 0;
      g_States[i].currentGMTDay     = 0;

      if(!g_States[i].enabled)
         continue;

      if(!SymbolSelect(g_States[i].symbol, true))
      {
         PrintFormat("WARN: %s not found in Market Watch — disabling.", g_States[i].symbol);
         g_States[i].enabled = false;
         continue;
      }

      activeCount++;
      PrintFormat("Symbol enabled: %s", g_States[i].symbol);

      // Recover state if EA was restarted mid-session
      InitSymbolState(i);
   }

   if(activeCount == 0)
   {
      Print("ERROR: No valid symbols enabled. EA stopping.");
      return INIT_FAILED;
   }

   PrintFormat("Tokyo Range Breakout EA v1.00 ready — %d symbol(s) active.", activeCount);
   PrintFormat("Range: %02d:00-%02d:00 GMT | Cancel: %02d:00 GMT | Force-close: %02d:00 GMT",
               RangeStartHourGMT, RangeEndHourGMT, OrderCancelHourGMT, ForceCloseHourGMT);

   return INIT_SUCCEEDED;
}

void OnDeinit(const int reason)
{
   PrintFormat("Tokyo Range Breakout EA stopped. Reason: %d", reason);
}

//=== Main Tick ====================================================

void OnTick()
{
   datetime    gmtNow = GetGMTTime();
   MqlDateTime gmtDT;
   TimeToStruct(gmtNow, gmtDT);

   for(int i = 0; i < NUM_SYMBOLS; i++)
   {
      if(!g_States[i].enabled) continue;
      ProcessSymbol(i, gmtNow, gmtDT);
   }
}

//=== Time Helpers =================================================

// Broker server time → GMT
datetime GetGMTTime()
{
   return TimeCurrent() - (long)BrokerGMTOffsetHours * 3600;
}

// Strip hours/mins/secs to get midnight of the given GMT day
datetime GetGMTMidnight(datetime gmtTime)
{
   MqlDateTime dt;
   TimeToStruct(gmtTime, dt);
   dt.hour = 0; dt.min = 0; dt.sec = 0;
   return StructToTime(dt);
}

// GMT datetime → broker server time
datetime GMTToBroker(datetime gmtTime)
{
   return gmtTime + (long)BrokerGMTOffsetHours * 3600;
}

//=== Pip Helpers ==================================================

// 1 pip expressed as a price distance for the given symbol.
// Works for both 3/5-digit (JPY / non-JPY) brokers.
double PipSize(const string symbol)
{
   int    digits = (int)SymbolInfoInteger(symbol, SYMBOL_DIGITS);
   double point  = SymbolInfoDouble(symbol, SYMBOL_POINT);
   // 3-digit JPY or 5-digit non-JPY → 1 pip = 10 points
   return (digits == 3 || digits == 5) ? point * 10.0 : point;
}

double PipsToPrice(const string symbol, double pips)
{
   return pips * PipSize(symbol);
}

double PriceToPips(const string symbol, double priceDistance)
{
   double pip = PipSize(symbol);
   return (pip > 0.0) ? (priceDistance / pip) : 0.0;
}

// Value of 1 pip movement per 1 standard lot, in account currency.
double PipValuePerLot(const string symbol)
{
   double tickVal  = SymbolInfoDouble(symbol, SYMBOL_TRADE_TICK_VALUE);
   double tickSize = SymbolInfoDouble(symbol, SYMBOL_TRADE_TICK_SIZE);
   double pip      = PipSize(symbol);
   if(tickSize == 0.0) return 0.0;
   return (pip / tickSize) * tickVal;
}

//=== Lot Calculation ==============================================

double CalculateLots(const string symbol, double slDistancePips)
{
   double lots;

   if(UseRiskPercent && slDistancePips > 0.0)
   {
      double balance = AccountInfoDouble(ACCOUNT_BALANCE);
      double risk    = balance * RiskPercent / 100.0;
      double pipVal  = PipValuePerLot(symbol);

      if(pipVal <= 0.0)
      {
         PrintFormat("%s: ERROR — pip value is zero, cannot size position by risk.", symbol);
         return 0.0;
      }

      lots = risk / (slDistancePips * pipVal);
      PrintFormat("%s: Risk sizing — balance=%.2f risk=%.2f SL=%.1f pips pipVal=%.5f → raw lots=%.4f",
                  symbol, balance, risk, slDistancePips, pipVal, lots);
   }
   else
   {
      lots = FixedLotSize;
   }

   // Clamp and normalise to symbol constraints
   double minLot  = SymbolInfoDouble(symbol, SYMBOL_VOLUME_MIN);
   double maxLot  = SymbolInfoDouble(symbol, SYMBOL_VOLUME_MAX);
   double lotStep = SymbolInfoDouble(symbol, SYMBOL_VOLUME_STEP);

   if(lotStep > 0.0)
      lots = MathFloor(lots / lotStep) * lotStep;

   lots = MathMax(lots, minLot);
   lots = MathMin(lots, maxLot);
   return NormalizeDouble(lots, 2);
}

//=== Core Symbol Processing =======================================

void ProcessSymbol(int idx, datetime gmtNow, MqlDateTime &gmtDT)
{
   string symbol  = g_States[idx].symbol;
   int    gmtHour = gmtDT.hour;
   int    gmtDow  = gmtDT.day_of_week; // 0=Sun 1=Mon 2=Tue 3=Wed 4=Thu 5=Fri 6=Sat

   //--- Detect new GMT day and reset state ---
   datetime todayGMT = GetGMTMidnight(gmtNow);
   if(todayGMT != g_States[idx].currentGMTDay)
      ResetDailyState(idx, todayGMT);

   //--- 1. Force-close window (>= ForceCloseHourGMT) ---
   if(gmtHour >= ForceCloseHourGMT)
   {
      CancelPendingOrders(idx, StringFormat("Force-close window (%02d:00 GMT)", ForceCloseHourGMT));
      ForceClosePositions(idx);
      return;
   }

   //--- 2. Cancel window (OrderCancelHourGMT <= hour < ForceCloseHourGMT) ---
   if(gmtHour >= OrderCancelHourGMT)
   {
      CancelPendingOrders(idx, StringFormat("%02d:00 GMT cancel window", OrderCancelHourGMT));
      return;
   }

   //--- 3. Range accumulation window (RangeStartHourGMT <= hour < RangeEndHourGMT) ---
   if(gmtHour >= RangeStartHourGMT && gmtHour < RangeEndHourGMT)
   {
      AccumulateRange(idx);
      return;
   }

   //--- 4. Order placement (gmtHour == RangeEndHourGMT, once per day) ---
   if(gmtHour == RangeEndHourGMT && !g_States[idx].ordersPlacedToday)
   {
      if(gmtDow == 1 && !AllowMondayTrading)
      {
         PrintFormat("%s: SKIP — Monday trading disabled.", symbol);
         g_States[idx].ordersPlacedToday = true;
         return;
      }
      if(gmtDow == 5 && !AllowFridayTrading)
      {
         PrintFormat("%s: SKIP — Friday trading disabled.", symbol);
         g_States[idx].ordersPlacedToday = true;
         return;
      }

      // If range was not built in real-time (e.g. EA restarted), recover from history
      if(!g_States[idx].rangeCalculated)
         CalculateRangeFromHistory(idx);

      PlacePendingOrders(idx);
      return;
   }

   //--- 5. Monitoring window (RangeEndHourGMT <= hour < OrderCancelHourGMT) ---
   if(gmtHour >= RangeEndHourGMT && gmtHour < OrderCancelHourGMT)
   {
      if(CancelOppositeOrderAfterEntry)
         CheckCancelOppositeOrder(idx);
   }
}

//=== Daily State ==================================================

void ResetDailyState(int idx, datetime newGMTDay)
{
   PrintFormat("%s: New GMT day (%s) — resetting daily state.",
               g_States[idx].symbol, TimeToString(newGMTDay, TIME_DATE));
   g_States[idx].rangeHigh         = 0.0;
   g_States[idx].rangeLow          = DBL_MAX;
   g_States[idx].rangeCalculated   = false;
   g_States[idx].ordersPlacedToday = false;
   g_States[idx].buyOrderTicket    = 0;
   g_States[idx].sellOrderTicket   = 0;
   g_States[idx].currentGMTDay     = newGMTDay;
}

//=== Range Building ===============================================

void AccumulateRange(int idx)
{
   string symbol = g_States[idx].symbol;
   double ask    = SymbolInfoDouble(symbol, SYMBOL_ASK);
   double bid    = SymbolInfoDouble(symbol, SYMBOL_BID);

   if(ask > g_States[idx].rangeHigh || g_States[idx].rangeHigh == 0.0)
   {
      g_States[idx].rangeHigh       = ask;
      g_States[idx].rangeCalculated = true;
   }
   if(bid < g_States[idx].rangeLow)
   {
      g_States[idx].rangeLow        = bid;
      g_States[idx].rangeCalculated = true;
   }
}

// Rebuild the Tokyo range from stored H1 (or M1 fallback) bars.
// Used when the EA is restarted after 06:00 GMT.
void CalculateRangeFromHistory(int idx)
{
   string   symbol   = g_States[idx].symbol;
   datetime gmtDay   = g_States[idx].currentGMTDay;

   // Convert GMT range boundaries to broker server time for CopyRates
   datetime bStart = GMTToBroker(gmtDay + (long)RangeStartHourGMT * 3600);
   // Subtract 1 second so we don't accidentally include the bar at RangeEndHour
   datetime bEnd   = GMTToBroker(gmtDay + (long)RangeEndHourGMT   * 3600) - 1;

   MqlRates bars[];
   int count = CopyRates(symbol, PERIOD_H1, bStart, bEnd, bars);

   if(count <= 0)
   {
      PrintFormat("%s: No H1 bars for range recovery — trying M1.", symbol);
      count = CopyRates(symbol, PERIOD_M1, bStart, bEnd, bars);
   }

   if(count <= 0)
   {
      PrintFormat("%s: ERROR — cannot recover Tokyo range from history.", symbol);
      return;
   }

   double high = 0.0, low = DBL_MAX;
   for(int i = 0; i < count; i++)
   {
      if(bars[i].high > high) high = bars[i].high;
      if(bars[i].low  < low)  low  = bars[i].low;
   }

   if(high > 0.0 && low < DBL_MAX)
   {
      g_States[idx].rangeHigh       = high;
      g_States[idx].rangeLow        = low;
      g_States[idx].rangeCalculated = true;
      PrintFormat("%s: Tokyo range recovered from %d bar(s) — High=%.5f Low=%.5f Width=%.1f pips",
                  symbol, count, high, low, PriceToPips(symbol, high - low));
   }
}

//=== Order Placement ==============================================

void PlacePendingOrders(int idx)
{
   string symbol = g_States[idx].symbol;

   // Set flag immediately to prevent re-entry on subsequent ticks
   g_States[idx].ordersPlacedToday = true;

   //--- Guard: range must be available ---
   if(!g_States[idx].rangeCalculated || g_States[idx].rangeHigh == 0.0)
   {
      PrintFormat("%s: SKIP — Tokyo range not available.", symbol);
      return;
   }

   double rangeHigh = g_States[idx].rangeHigh;
   double rangeLow  = g_States[idx].rangeLow;
   int    digits    = (int)SymbolInfoInteger(symbol, SYMBOL_DIGITS);
   double pip       = PipSize(symbol);
   double rangeW    = PriceToPips(symbol, rangeHigh - rangeLow);

   PrintFormat("%s: Tokyo Range — High=%.5f  Low=%.5f  Width=%.1f pips",
               symbol, rangeHigh, rangeLow, rangeW);

   //--- Range width filter ---
   if(rangeW < MinRangePips)
   {
      PrintFormat("%s: SKIP — Range %.1f pips is below minimum %.1f pips.",
                  symbol, rangeW, MinRangePips);
      return;
   }
   if(rangeW > MaxRangePips)
   {
      PrintFormat("%s: SKIP — Range %.1f pips exceeds maximum %.1f pips.",
                  symbol, rangeW, MaxRangePips);
      return;
   }

   //--- Spread filter ---
   long   spreadPts  = SymbolInfoInteger(symbol, SYMBOL_SPREAD);
   double pointSize  = SymbolInfoDouble(symbol, SYMBOL_POINT);
   double spreadPips = PriceToPips(symbol, (double)spreadPts * pointSize);
   if(spreadPips > MaxSpreadPips)
   {
      PrintFormat("%s: SKIP — Spread %.1f pips exceeds maximum %.1f pips.",
                  symbol, spreadPips, MaxSpreadPips);
      return;
   }

   //--- Duplicate guard ---
   if(HasActiveOrdersOrPositions(symbol))
   {
      PrintFormat("%s: SKIP — Active orders/positions already exist for magic %I64u.",
                  symbol, MagicNumber);
      return;
   }

   //--- Entry prices ---
   double buffer    = PipsToPrice(symbol, EntryBufferPips);
   double buyEntry  = NormalizeDouble(rangeHigh + buffer, digits);
   double sellEntry = NormalizeDouble(rangeLow  - buffer, digits);

   //--- Stop Loss ---
   // Buy SL  = Tokyo range low  (opposite end of range)
   // Sell SL = Tokyo range high (opposite end of range)
   double buySL  = NormalizeDouble(rangeLow,  digits);
   double sellSL = NormalizeDouble(rangeHigh, digits);

   //--- Take Profit (range_width × multiplier, measured from pending entry price) ---
   double tpPips     = rangeW * TakeProfitMultiplier;
   double tpDist     = PipsToPrice(symbol, tpPips);
   double buyTP      = NormalizeDouble(buyEntry  + tpDist, digits);
   double sellTP     = NormalizeDouble(sellEntry - tpDist, digits);

   PrintFormat("%s: Buy Stop  — entry=%.5f  SL=%.5f  TP=%.5f  (TP=%.1f pips)",
               symbol, buyEntry, buySL, buyTP, tpPips);
   PrintFormat("%s: Sell Stop — entry=%.5f  SL=%.5f  TP=%.5f  (TP=%.1f pips)",
               symbol, sellEntry, sellSL, sellTP, tpPips);

   //--- Lot sizes ---
   double buySLPips  = PriceToPips(symbol, buyEntry  - buySL);
   double sellSLPips = PriceToPips(symbol, sellSL - sellEntry);
   double buyLots    = CalculateLots(symbol, buySLPips);
   double sellLots   = CalculateLots(symbol, sellSLPips);

   if(buyLots <= 0.0 || sellLots <= 0.0)
   {
      PrintFormat("%s: SKIP — Lot size calculation returned 0 (check balance/risk settings).", symbol);
      return;
   }

   // Orders expire at the cancel hour (broker time)
   datetime expiry = GMTToBroker(g_States[idx].currentGMTDay + (long)OrderCancelHourGMT * 3600);

   //--- Place Buy Stop ---
   if(trade.BuyStop(buyLots, buyEntry, symbol, buySL, buyTP,
                    ORDER_TIME_SPECIFIED, expiry, "TRB_BS_" + symbol))
   {
      g_States[idx].buyOrderTicket = trade.ResultOrder();
      PrintFormat("%s: Buy Stop placed — ticket=%I64u  lots=%.2f  expiry=%s",
                  symbol, g_States[idx].buyOrderTicket, buyLots,
                  TimeToString(expiry, TIME_DATE|TIME_MINUTES));
   }
   else
   {
      PrintFormat("%s: ERROR placing Buy Stop — retcode=%u  %s",
                  symbol, trade.ResultRetcode(), trade.ResultComment());
   }

   //--- Place Sell Stop ---
   if(trade.SellStop(sellLots, sellEntry, symbol, sellSL, sellTP,
                     ORDER_TIME_SPECIFIED, expiry, "TRB_SS_" + symbol))
   {
      g_States[idx].sellOrderTicket = trade.ResultOrder();
      PrintFormat("%s: Sell Stop placed — ticket=%I64u  lots=%.2f  expiry=%s",
                  symbol, g_States[idx].sellOrderTicket, sellLots,
                  TimeToString(expiry, TIME_DATE|TIME_MINUTES));
   }
   else
   {
      PrintFormat("%s: ERROR placing Sell Stop — retcode=%u  %s",
                  symbol, trade.ResultRetcode(), trade.ResultComment());
   }
}

//=== Order & Position Management ==================================

// Cancel every pending order for this symbol/magic (reverse iteration is safe)
void CancelPendingOrders(int idx, const string reason)
{
   string symbol = g_States[idx].symbol;

   for(int i = OrdersTotal() - 1; i >= 0; i--)
   {
      ulong ticket = OrderGetTicket(i);
      if(ticket == 0) continue;
      if(!OrderSelect(ticket)) continue;
      if(OrderGetString(ORDER_SYMBOL)  != symbol)      continue;
      if(OrderGetInteger(ORDER_MAGIC)  != MagicNumber) continue;

      if(trade.OrderDelete(ticket))
         PrintFormat("%s: Pending order %I64u cancelled — %s", symbol, ticket, reason);
      else
         PrintFormat("%s: ERROR cancelling order %I64u — retcode=%u", symbol, ticket, trade.ResultRetcode());
   }
}

// Force-close every open position for this symbol/magic
void ForceClosePositions(int idx)
{
   string symbol = g_States[idx].symbol;

   for(int i = PositionsTotal() - 1; i >= 0; i--)
   {
      ulong ticket = PositionGetTicket(i);
      if(ticket == 0) continue;
      if(!PositionSelectByTicket(ticket)) continue;
      if(PositionGetString(POSITION_SYMBOL)  != symbol)      continue;
      if(PositionGetInteger(POSITION_MAGIC)  != MagicNumber) continue;

      if(trade.PositionClose(ticket))
         PrintFormat("%s: Position %I64u force-closed at %02d:00 GMT.", symbol, ticket, ForceCloseHourGMT);
      else
         PrintFormat("%s: ERROR force-closing position %I64u — retcode=%u", symbol, ticket, trade.ResultRetcode());
   }
}

// If a position exists (one order triggered), cancel the remaining pending order
void CheckCancelOppositeOrder(int idx)
{
   string symbol    = g_States[idx].symbol;
   bool   hasPosition = false;

   for(int i = PositionsTotal() - 1; i >= 0; i--)
   {
      ulong ticket = PositionGetTicket(i);
      if(ticket == 0) continue;
      if(!PositionSelectByTicket(ticket)) continue;
      if(PositionGetString(POSITION_SYMBOL)  != symbol)      continue;
      if(PositionGetInteger(POSITION_MAGIC)  != MagicNumber) continue;
      hasPosition = true;
      break;
   }

   if(hasPosition)
      CancelPendingOrders(idx, "CancelOppositeOrderAfterEntry — position already open");
}

// Returns true if any pending order OR open position exists for symbol/magic
bool HasActiveOrdersOrPositions(const string symbol)
{
   for(int i = OrdersTotal() - 1; i >= 0; i--)
   {
      ulong ticket = OrderGetTicket(i);
      if(ticket == 0) continue;
      if(!OrderSelect(ticket)) continue;
      if(OrderGetString(ORDER_SYMBOL) == symbol && OrderGetInteger(ORDER_MAGIC) == MagicNumber)
         return true;
   }

   for(int i = PositionsTotal() - 1; i >= 0; i--)
   {
      ulong ticket = PositionGetTicket(i);
      if(ticket == 0) continue;
      if(!PositionSelectByTicket(ticket)) continue;
      if(PositionGetString(POSITION_SYMBOL) == symbol && PositionGetInteger(POSITION_MAGIC) == MagicNumber)
         return true;
   }

   return false;
}

//=== Startup State Recovery =======================================

// Called once per symbol in OnInit to detect a mid-session restart.
void InitSymbolState(int idx)
{
   string   symbol  = g_States[idx].symbol;
   datetime gmtNow  = GetGMTTime();
   datetime today   = GetGMTMidnight(gmtNow);
   g_States[idx].currentGMTDay = today;

   MqlDateTime gmtDT;
   TimeToStruct(gmtNow, gmtDT);
   int gmtHour = gmtDT.hour;

   if(gmtHour >= ForceCloseHourGMT || gmtHour >= OrderCancelHourGMT)
   {
      // Past the action window — nothing to do today
      g_States[idx].ordersPlacedToday = true;
      PrintFormat("%s: Startup at %02d:00 GMT — past action window, no orders today.", symbol, gmtHour);
      return;
   }

   if(gmtHour >= RangeEndHourGMT)
   {
      // Between 06:00 and 09:00 — check for existing orders
      if(HasActiveOrdersOrPositions(symbol))
      {
         PrintFormat("%s: Restart detected — existing orders/positions found. Marking today as handled.", symbol);
         g_States[idx].ordersPlacedToday = true;

         // Recover known ticket numbers for logging
         for(int i = OrdersTotal() - 1; i >= 0; i--)
         {
            ulong ticket = OrderGetTicket(i);
            if(ticket == 0) continue;
            if(!OrderSelect(ticket)) continue;
            if(OrderGetString(ORDER_SYMBOL) != symbol) continue;
            if(OrderGetInteger(ORDER_MAGIC) != MagicNumber) continue;

            ENUM_ORDER_TYPE ot = (ENUM_ORDER_TYPE)OrderGetInteger(ORDER_TYPE);
            if(ot == ORDER_TYPE_BUY_STOP)
            {
               g_States[idx].buyOrderTicket = ticket;
               PrintFormat("%s: Recovered Buy Stop ticket %I64u", symbol, ticket);
            }
            else if(ot == ORDER_TYPE_SELL_STOP)
            {
               g_States[idx].sellOrderTicket = ticket;
               PrintFormat("%s: Recovered Sell Stop ticket %I64u", symbol, ticket);
            }
         }
      }
      else
      {
         // No orders exist — attempt to place from historical data
         PrintFormat("%s: Restart at %02d:00 GMT with no active orders — recovering range from history.", symbol, gmtHour);
         CalculateRangeFromHistory(idx);
         // PlacePendingOrders will be called on the next tick by ProcessSymbol
      }
      return;
   }

   if(gmtHour >= RangeStartHourGMT)
   {
      // Restarted during range accumulation window — rebuild partial range
      PrintFormat("%s: Restart during range window — recovering partial range from history.", symbol);
      CalculateRangeFromHistory(idx);
   }
   // else: before 00:00 GMT (very unlikely) — normal flow will handle it
}
