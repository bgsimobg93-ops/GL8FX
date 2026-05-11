//+------------------------------------------------------------------+
//|                                      VWAP_Trend_CFD_v4.0        |
//| Intraday session VWAP trend-following for MT5 CFDs               |
//| One trade per session · Session VWAP reset · ATR stops           |
//+------------------------------------------------------------------+
#property strict
#property version "4.00"

#include <Trade/Trade.mqh>

//--- Session (all times in GMT)
input int    InpGMTStartHour      = 13;  // Session start hour (GMT)
input int    InpGMTStartMin       = 30;  // Session start minute (GMT)
input int    InpGMTEndHour        = 20;  // Session end hour (GMT)
input int    InpGMTEndMin         = 0;   // Session end minute (GMT)

//--- Strategy
input int    InpMinVWAPBars       = 10;  // Min bars after session open before entry
input bool   InpAllowLong         = true;
input bool   InpAllowShort        = true;
input bool   InpExitOnVWAPCross   = true;  // Exit when price crosses VWAP
input int    InpCrossConfirmBars  = 3;     // Bars on wrong side before exit

//--- Risk
input double InpRiskPct           = 1.0;   // Risk % of equity per trade
input double InpSLATRMult         = 1.5;   // SL distance = ATR × this
input double InpTPRR              = 0.0;   // TP as R:R multiple (0 = hold to session end)
input int    InpATRPeriod         = 14;

//--- Trade settings
input string InpSymbol            = "";
input ENUM_TIMEFRAMES InpTF       = PERIOD_M1;
input int    InpSlippage          = 30;
input long   InpMagic             = 88881;

//--- Globals
CTrade   trade;
string   Sym;
int      atrHandle          = INVALID_HANDLE;
datetime lastBarTime        = 0;
int      brokerOffsetSec    = 0;

// Session state
bool     inSession          = false;
datetime sessStart          = 0;
datetime sessEnd            = 0;
bool     enteredThisSession = false;
int      crossBarsCount     = 0;

// VWAP
double   vwapVal            = 0.0;
bool     vwapReady          = false;

//--- Forward declarations
bool   CalcSession(datetime &ss, datetime &se);
bool   RebuildVWAP(double &vwap);
bool   HasPosition(ENUM_POSITION_TYPE &ptype);
void   CheckManagePos(double price);
void   CheckEntry(double price, double atr);
void   CloseAll(string why);
double CalcLots(double slDist);
double NP(double p);

//+------------------------------------------------------------------+
int OnInit()
{
   Sym = (InpSymbol == "") ? _Symbol : InpSymbol;
   brokerOffsetSec = (int)(TimeCurrent() - TimeGMT());

   atrHandle = iATR(Sym, InpTF, InpATRPeriod);
   if(atrHandle == INVALID_HANDLE)
   {
      Print("ATR handle failed. Error: ", GetLastError());
      return INIT_FAILED;
   }

   trade.SetExpertMagicNumber(InpMagic);
   trade.SetDeviationInPoints(InpSlippage);

   Print("VWAP Trend CFD v4.0 | ", Sym, " | BrokerOffset=", brokerOffsetSec / 3600, "h",
         " | Session GMT ", InpGMTStartHour, ":", InpGMTStartMin,
         "-", InpGMTEndHour, ":", InpGMTEndMin);
   return INIT_SUCCEEDED;
}

//+------------------------------------------------------------------+
void OnDeinit(const int reason)
{
   if(atrHandle != INVALID_HANDLE) IndicatorRelease(atrHandle);
}

//+------------------------------------------------------------------+
void OnTick()
{
   datetime bt = iTime(Sym, InpTF, 0);
   if(bt == 0 || bt == lastBarTime) return;
   lastBarTime = bt;

   datetime ss, se;
   if(!CalcSession(ss, se)) return;

   datetime now = TimeCurrent();
   bool nowIn = (now >= ss && now < se);

   // Session open
   if(nowIn && !inSession)
   {
      inSession           = true;
      sessStart           = ss;
      sessEnd             = se;
      enteredThisSession  = false;
      crossBarsCount      = 0;
      vwapReady           = false;
      Print("Session open | End: ", TimeToString(se, TIME_DATE | TIME_MINUTES));
   }
   // Session close
   else if(!nowIn && inSession)
   {
      CloseAll("Session end");
      inSession           = false;
      enteredThisSession  = false;
      crossBarsCount      = 0;
      vwapReady           = false;
      return;
   }

   if(!inSession) return;

   // Rebuild session VWAP from scratch each bar
   double vwap;
   if(!RebuildVWAP(vwap)) return;
   vwapVal   = vwap;
   vwapReady = true;

   // ATR
   double atrArr[];
   ArraySetAsSeries(atrArr, true);
   if(CopyBuffer(atrHandle, 0, 1, 1, atrArr) < 1) return;
   double atr = atrArr[0];
   if(atr <= 0.0) return;

   // Last completed bar close
   double closeArr[];
   ArraySetAsSeries(closeArr, true);
   if(CopyClose(Sym, InpTF, 0, 2, closeArr) < 2) return;
   double price = closeArr[1];

   CheckManagePos(price);
   CheckEntry(price, atr);
}

//+------------------------------------------------------------------+
bool CalcSession(datetime &ss, datetime &se)
{
   datetime gNow = TimeGMT();
   MqlDateTime d;
   TimeToStruct(gNow, d);

   ss = StringToTime(StringFormat("%04d.%02d.%02d %02d:%02d:00",
        d.year, d.mon, d.day, InpGMTStartHour, InpGMTStartMin)) + brokerOffsetSec;
   se = StringToTime(StringFormat("%04d.%02d.%02d %02d:%02d:00",
        d.year, d.mon, d.day, InpGMTEndHour, InpGMTEndMin)) + brokerOffsetSec;
   return (ss < se);
}

//+------------------------------------------------------------------+
bool RebuildVWAP(double &vwap)
{
   if(sessStart == 0) return false;

   int startBar = iBarShift(Sym, InpTF, sessStart, false);
   // Need at least InpMinVWAPBars completed bars after session open
   if(startBar < InpMinVWAPBars || startBar > 1440) return false;

   double cumTPV = 0.0, cumVol = 0.0;
   for(int i = startBar; i >= 1; i--)
   {
      double h = iHigh(Sym, InpTF, i);
      double l = iLow(Sym, InpTF, i);
      double c = iClose(Sym, InpTF, i);
      long   v = iVolume(Sym, InpTF, i);
      if(v > 0 && h > 0)
      {
         cumTPV += ((h + l + c) / 3.0) * (double)v;
         cumVol += (double)v;
      }
   }
   if(cumVol <= 0.0) return false;

   vwap = cumTPV / cumVol;
   return true;
}

//+------------------------------------------------------------------+
bool HasPosition(ENUM_POSITION_TYPE &ptype)
{
   for(int i = PositionsTotal() - 1; i >= 0; i--)
   {
      ulong ticket = PositionGetTicket(i);
      if(ticket == 0) continue;
      if(PositionGetString(POSITION_SYMBOL) != Sym) continue;
      if(PositionGetInteger(POSITION_MAGIC) != InpMagic) continue;
      ptype = (ENUM_POSITION_TYPE)PositionGetInteger(POSITION_TYPE);
      return true;
   }
   return false;
}

//+------------------------------------------------------------------+
void CheckManagePos(double price)
{
   ENUM_POSITION_TYPE ptype;
   if(!HasPosition(ptype)) return;
   if(!InpExitOnVWAPCross) return;

   bool wrongSide = (ptype == POSITION_TYPE_BUY  && price < vwapVal) ||
                    (ptype == POSITION_TYPE_SELL && price > vwapVal);

   if(wrongSide)
      crossBarsCount++;
   else
      crossBarsCount = 0;

   if(crossBarsCount >= InpCrossConfirmBars)
   {
      CloseAll("VWAP cross");
      enteredThisSession = false;  // Allow reversal entry
      crossBarsCount     = 0;
   }
}

//+------------------------------------------------------------------+
void CheckEntry(double price, double atr)
{
   ENUM_POSITION_TYPE ptype;
   if(HasPosition(ptype)) return;   // Already in a position
   if(enteredThisSession) return;   // One entry per session (or until reversal exit)

   double slDist = InpSLATRMult * atr;
   if(slDist <= 0.0) return;

   if(price > vwapVal && InpAllowLong)
   {
      double ask = SymbolInfoDouble(Sym, SYMBOL_ASK);
      double sl  = NP(vwapVal - slDist);
      double tp  = (InpTPRR > 0.0) ? NP(ask + (ask - sl) * InpTPRR) : 0.0;
      if(ask <= sl) return;
      double vol = CalcLots(ask - sl);
      if(vol <= 0.0) return;
      if(trade.Buy(vol, Sym, ask, sl, tp, "VWAP Long"))
      {
         enteredThisSession = true;
         crossBarsCount     = 0;
         Print("BUY | ask=", ask, " vwap=", vwapVal, " sl=", sl, " tp=", tp);
      }
   }
   else if(price < vwapVal && InpAllowShort)
   {
      double bid = SymbolInfoDouble(Sym, SYMBOL_BID);
      double sl  = NP(vwapVal + slDist);
      double tp  = (InpTPRR > 0.0) ? NP(bid - (sl - bid) * InpTPRR) : 0.0;
      if(bid >= sl) return;
      double vol = CalcLots(sl - bid);
      if(vol <= 0.0) return;
      if(trade.Sell(vol, Sym, bid, sl, tp, "VWAP Short"))
      {
         enteredThisSession = true;
         crossBarsCount     = 0;
         Print("SELL | bid=", bid, " vwap=", vwapVal, " sl=", sl, " tp=", tp);
      }
   }
}

//+------------------------------------------------------------------+
void CloseAll(string why)
{
   for(int i = PositionsTotal() - 1; i >= 0; i--)
   {
      ulong ticket = PositionGetTicket(i);
      if(ticket == 0) continue;
      if(PositionGetString(POSITION_SYMBOL) != Sym) continue;
      if(PositionGetInteger(POSITION_MAGIC) != InpMagic) continue;
      trade.PositionClose(ticket);
      Print("Closed #", ticket, " | ", why);
   }
}

//+------------------------------------------------------------------+
double CalcLots(double slDist)
{
   if(slDist <= 0.0) return 0.0;
   double equity   = AccountInfoDouble(ACCOUNT_EQUITY);
   double riskAmt  = equity * (InpRiskPct / 100.0);
   double tickSz   = SymbolInfoDouble(Sym, SYMBOL_TRADE_TICK_SIZE);
   double tickVal  = SymbolInfoDouble(Sym, SYMBOL_TRADE_TICK_VALUE);
   double minLot   = SymbolInfoDouble(Sym, SYMBOL_VOLUME_MIN);
   double maxLot   = SymbolInfoDouble(Sym, SYMBOL_VOLUME_MAX);
   double lotStep  = SymbolInfoDouble(Sym, SYMBOL_VOLUME_STEP);
   if(tickSz <= 0 || tickVal <= 0 || lotStep <= 0) return 0.0;

   double lossPerLot = (slDist / tickSz) * tickVal;
   if(lossPerLot <= 0.0) return 0.0;

   double raw = riskAmt / lossPerLot;
   if(raw < minLot) { Print("Lot below minimum, trade skipped."); return 0.0; }

   double lot = MathMin(maxLot, MathFloor(raw / lotStep) * lotStep);
   if(lot < minLot) return 0.0;

   double step = lotStep; int digs = 0;
   while(step < 1.0 && digs < 8) { step *= 10.0; digs++; }
   return NormalizeDouble(lot, digs);
}

//+------------------------------------------------------------------+
double NP(double p)
{
   if(p == 0.0) return 0.0;
   return NormalizeDouble(p, (int)SymbolInfoInteger(Sym, SYMBOL_DIGITS));
}
//+------------------------------------------------------------------+
