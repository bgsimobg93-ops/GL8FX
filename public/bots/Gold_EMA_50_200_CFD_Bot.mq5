//+------------------------------------------------------------------+
//|                                         Gold_EMA_50_200_CFD_Bot  |
//| EMA 50/200 crossover EA for MT5 CFDs                             |
//| v2.5 — Long only, 2% риск                                       |
//+------------------------------------------------------------------+
#property strict
#property version "2.50"

#include <Trade/Trade.mqh>

input string          InpTradeSymbol      = "";
input ENUM_TIMEFRAMES InpTimeframe        = PERIOD_CURRENT;
input int             InpFastEMA          = 50;
input int             InpSlowEMA          = 200;
input double          InpRiskPercent      = 2.0;
input int             InpSwingLookback    = 20;
input int             InpStopBufferPoints = 50;
input double          InpRewardRisk       = 0.0;
input int             InpSlippagePoints   = 30;
input long            InpMagicNumber      = 5020010;

CTrade trade;

int      fastEmaHandle = INVALID_HANDLE;
int      slowEmaHandle = INVALID_HANDLE;
datetime lastBarTime   = 0;
string   tradeSymbol   = "";

//+------------------------------------------------------------------+
int OnInit()
{
   tradeSymbol = (InpTradeSymbol == "") ? _Symbol : InpTradeSymbol;

   if(InpFastEMA <= 0 || InpSlowEMA <= 0 || InpFastEMA >= InpSlowEMA)
   {
      Print("Fast EMA must be positive and lower than Slow EMA.");
      return INIT_PARAMETERS_INCORRECT;
   }

   if(InpRiskPercent <= 0.0 || InpRiskPercent > 100.0)
   {
      Print("Risk percent must be between 0 and 100.");
      return INIT_PARAMETERS_INCORRECT;
   }

   if(InpSwingLookback < 2)
   {
      Print("Swing lookback must be at least 2 bars.");
      return INIT_PARAMETERS_INCORRECT;
   }

   fastEmaHandle = iMA(tradeSymbol, InpTimeframe, InpFastEMA, 0, MODE_EMA, PRICE_CLOSE);
   slowEmaHandle = iMA(tradeSymbol, InpTimeframe, InpSlowEMA, 0, MODE_EMA, PRICE_CLOSE);

   if(fastEmaHandle == INVALID_HANDLE || slowEmaHandle == INVALID_HANDLE)
   {
      Print("Failed to create EMA indicator handles. Error: ", GetLastError());
      return INIT_FAILED;
   }

   trade.SetExpertMagicNumber(InpMagicNumber);
   trade.SetDeviationInPoints(InpSlippagePoints);

   Print("Gold EMA Bot v2.5 | Long Only | Risk=", InpRiskPercent, "%");

   return INIT_SUCCEEDED;
}

//+------------------------------------------------------------------+
void OnDeinit(const int reason)
{
   if(fastEmaHandle != INVALID_HANDLE)
      IndicatorRelease(fastEmaHandle);

   if(slowEmaHandle != INVALID_HANDLE)
      IndicatorRelease(slowEmaHandle);
}

//+------------------------------------------------------------------+
void OnTick()
{
   datetime currentBarTime = iTime(tradeSymbol, InpTimeframe, 0);
   if(currentBarTime == 0 || currentBarTime == lastBarTime)
      return;

   lastBarTime = currentBarTime;

   double closePrices[];
   double fastEma[];
   double slowEma[];
   ArraySetAsSeries(closePrices, true);
   ArraySetAsSeries(fastEma, true);
   ArraySetAsSeries(slowEma, true);

   if(CopyClose(tradeSymbol, InpTimeframe, 0, 3, closePrices) != 3) return;
   if(CopyBuffer(fastEmaHandle, 0, 0, 3, fastEma) != 3) return;
   if(CopyBuffer(slowEmaHandle, 0, 0, 3, slowEma) != 3) return;

   if(ManageOpenPosition(closePrices[1], fastEma[1], slowEma[1]))
      return;

   // Само лонг crossover
   bool crossedAbove = closePrices[2] <= MathMax(fastEma[2], slowEma[2]) &&
                       closePrices[1] >  MathMax(fastEma[1], slowEma[1]);

   if(crossedAbove)
      OpenLong();
}

//+------------------------------------------------------------------+
bool ManageOpenPosition(const double lastClose, const double fastEma, const double slowEma)
{
   for(int i = PositionsTotal() - 1; i >= 0; i--)
   {
      ulong ticket = PositionGetTicket(i);
      if(ticket == 0) continue;

      if(PositionGetString(POSITION_SYMBOL) != tradeSymbol ||
         PositionGetInteger(POSITION_MAGIC) != InpMagicNumber)
         continue;

      // Затвори лонг когато цената затвори под ДВЕТЕ EMA
      if(lastClose < MathMin(fastEma, slowEma))
         trade.PositionClose(ticket);

      return true;
   }
   return false;
}

//+------------------------------------------------------------------+
void OpenLong()
{
   double ask      = SymbolInfoDouble(tradeSymbol, SYMBOL_ASK);
   double point    = SymbolInfoDouble(tradeSymbol, SYMBOL_POINT);
   double stopLoss = FindRecentLow() - (InpStopBufferPoints * point);

   if(ask <= 0.0 || stopLoss <= 0.0 || stopLoss >= ask)
      return;

   double volume = CalculateVolume(ask - stopLoss);
   if(volume <= 0.0) return;

   double takeProfit = 0.0;
   if(InpRewardRisk > 0.0)
      takeProfit = ask + ((ask - stopLoss) * InpRewardRisk);

   trade.Buy(volume, tradeSymbol, ask, NormalizePrice(stopLoss), NormalizePrice(takeProfit), "EMA 50/200 long");
}

//+------------------------------------------------------------------+
double FindRecentLow()
{
   double lows[];
   ArraySetAsSeries(lows, true);
   int copied = CopyLow(tradeSymbol, InpTimeframe, 1, InpSwingLookback, lows);
   if(copied <= 0) return 0.0;
   double recentLow = lows[0];
   for(int i = 1; i < copied; i++) recentLow = MathMin(recentLow, lows[i]);
   return recentLow;
}

//+------------------------------------------------------------------+
double CalculateVolume(const double stopDistancePrice)
{
   double equity     = AccountInfoDouble(ACCOUNT_EQUITY);
   double riskMoney  = equity * (InpRiskPercent / 100.0);
   double tickSize   = SymbolInfoDouble(tradeSymbol, SYMBOL_TRADE_TICK_SIZE);
   double tickValue  = SymbolInfoDouble(tradeSymbol, SYMBOL_TRADE_TICK_VALUE);
   double minVolume  = SymbolInfoDouble(tradeSymbol, SYMBOL_VOLUME_MIN);
   double maxVolume  = SymbolInfoDouble(tradeSymbol, SYMBOL_VOLUME_MAX);
   double volumeStep = SymbolInfoDouble(tradeSymbol, SYMBOL_VOLUME_STEP);

   if(stopDistancePrice <= 0.0 || tickSize <= 0.0 || tickValue <= 0.0 || volumeStep <= 0.0)
      return 0.0;

   double lossPerLot = (stopDistancePrice / tickSize) * tickValue;
   if(lossPerLot <= 0.0) return 0.0;

   double rawVolume = riskMoney / lossPerLot;
   if(rawVolume < minVolume)
   {
      Print("Volume под минимума. Трейдът е пропуснат.");
      return 0.0;
   }

   double steppedVolume = MathFloor(rawVolume / volumeStep) * volumeStep;
   double volume        = MathMin(maxVolume, steppedVolume);
   if(volume < minVolume) return 0.0;

   return NormalizeVolume(volume);
}

//+------------------------------------------------------------------+
double NormalizePrice(const double price)
{
   if(price == 0.0) return 0.0;
   return NormalizeDouble(price, (int)SymbolInfoInteger(tradeSymbol, SYMBOL_DIGITS));
}

double NormalizeVolume(const double volume)
{
   double volumeStep = SymbolInfoDouble(tradeSymbol, SYMBOL_VOLUME_STEP);
   int digits = 0;
   while(volumeStep < 1.0 && digits < 8) { volumeStep *= 10.0; digits++; }
   return NormalizeDouble(volume, digits);
}
//+------------------------------------------------------------------+
