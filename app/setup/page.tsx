"use client";
import { useState } from "react";

type Form = { balance:number; rate:number; years:number; months:number; overpay?:number; houseValue:number; originalMortgage:number; fixedRateEndMonth?:number; fixedRateEndYear?:number; isTracker?:boolean };

export default function SetupPage() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<Form>({ balance: 0, rate: 0, years: 25, months: 0, overpay: 50, houseValue: 0, originalMortgage: 0, fixedRateEndMonth: 12, fixedRateEndYear: new Date().getFullYear() + 2, isTracker: false });

  const save = () => {
    localStorage.setItem("mortgageData", JSON.stringify(form));
    window.location.href = "/dashboard";
  };

  return (
    <div className="mx-auto max-w-2xl p-6">
      <Stepper step={step} />
      {step === 1 && <Basics form={form} setForm={setForm} onNext={()=>setStep(2)} />}
      {step === 2 && <Overpay form={form} setForm={setForm} onBack={()=>setStep(1)} onNext={()=>setStep(3)} />}
      {step === 3 && <Review form={form} onBack={()=>setStep(2)} onSave={save} />}
    </div>
  );
}

function Stepper({ step}:{step:number}) {
  return (
    <ol className="flex items-center gap-3 text-sm text-slate-500">
      {[1,2,3].map(n=>(
        <li key={n} className="flex items-center gap-2">
          <span className={`size-6 grid place-items-center rounded-full ${step>=n?'bg-ink-700 text-white':'bg-slate-200'}`}>{n}</span>
          {['Basics','Overpayment','Review'][n-1]}
          {n<3 && <span className="mx-3 h-px w-10 bg-slate-200"></span>}
        </li>
      ))}
    </ol>
  );
}

function Basics({ form, setForm, onNext }:{
  form:Form; setForm:(f:Form)=>void; onNext:()=>void
}) {
  return (
    <div className="mt-6">
      <h2 className="text-lg font-semibold mb-4">First, tell me about your current mortgage</h2>
      <form className="space-y-4" onSubmit={(e)=>{e.preventDefault(); onNext();}}>
      <div>
        <label className="block text-sm font-medium">Mortgage balance (£) *</label>
        <input type="number" inputMode="decimal" required className="input" value={form.balance || ''}
               onChange={e=>setForm({...form, balance:Number(e.target.value)})}/>
        <p className="mt-1 text-xs text-slate-500">Enter the remaining balance, not original loan.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium">Interest rate (APR %) *</label>
          <input type="number" step="0.01" required className="input" value={form.rate || ''}
                 onChange={e=>setForm({...form, rate:Number(e.target.value)})}/>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium">Years *</label>
            <input type="number" min="0" required className="input" value={form.years || ''}
                   onChange={e=>setForm({...form, years:Number(e.target.value)})}/>
          </div>
          <div>
            <label className="block text-sm font-medium">Months</label>
            <input type="number" min="0" max="11" className="input" value={form.months || ''}
                   onChange={e=>setForm({...form, months:Number(e.target.value)})}/>
          </div>
        </div>
      </div>


      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium">House value (£) *</label>
          <input type="number" min="0" step="1000" required className="input" value={form.houseValue || ''}
                 onChange={e=>setForm({...form, houseValue:Number(e.target.value)})}/>
          <p className="mt-1 text-xs text-slate-500">Current estimated value of your property.</p>
        </div>
        <div>
          <label className="block text-sm font-medium">Original mortgage value (£) *</label>
          <input type="number" min="0" step="1000" required className="input" value={form.originalMortgage || ''}
                 onChange={e=>setForm({...form, originalMortgage:Number(e.target.value)})}/>
          <p className="mt-1 text-xs text-slate-500">The original amount you borrowed.</p>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium">When does your current fixed rate end? *</label>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-600 mb-1">Month</label>
              <select className="input" value={form.fixedRateEndMonth || ''} 
                      onChange={e=>setForm({...form, fixedRateEndMonth:Number(e.target.value)})}>
                <option value="">Select month</option>
                <option value="1">January</option>
                <option value="2">February</option>
                <option value="3">March</option>
                <option value="4">April</option>
                <option value="5">May</option>
                <option value="6">June</option>
                <option value="7">July</option>
                <option value="8">August</option>
                <option value="9">September</option>
                <option value="10">October</option>
                <option value="11">November</option>
                <option value="12">December</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-600 mb-1">Year</label>
              <select className="input" value={form.fixedRateEndYear || ''}
                      onChange={e=>setForm({...form, fixedRateEndYear:Number(e.target.value)})}>
                <option value="">Select year</option>
                {Array.from({length: 10}, (_, i) => {
                  const year = new Date().getFullYear() + i;
                  return <option key={year} value={year}>{year}</option>;
                })}
              </select>
            </div>
          </div>
          <label className="flex items-center gap-2">
            <input type="radio" name="rateType" checked={form.isTracker || false}
                   onChange={e=>setForm({...form, isTracker: true})}/>
            <span className="text-sm">I'm on a tracker mortgage</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="rateType" checked={!form.isTracker}
                   onChange={e=>setForm({...form, isTracker: false})}/>
            <span className="text-sm">I'm on a fixed rate mortgage</span>
          </label>
        </div>
        <p className="mt-1 text-xs text-slate-500">This helps us understand your rate risk.</p>
      </div>


        <div className="flex justify-end">
          <button className="btn-primary" type="submit">Next</button>
        </div>
      </form>
    </div>
  );
}

function Overpay({ form, setForm, onBack, onNext }:{
  form:Form; setForm:(f:Form)=>void; onBack:()=>void; onNext:()=>void
}) {
  const [inputType, setInputType] = useState<'amount' | 'years'>('amount');
  const [targetYears, setTargetYears] = useState(25);

  // Calculate overpayment needed for target years
  const calculateOverpaymentForTarget = (years: number) => {
    const targetMonths = years * 12;
    const currentMonths = form.years * 12 + form.months;
    if (targetMonths >= currentMonths) return 0;
    
    // Simple calculation - this is a rough estimate
    const balance = form.balance;
    const rate = form.rate / 100 / 12;
    const currentPayment = rate === 0 ? balance / currentMonths : (balance * rate) / (1 - Math.pow(1 + rate, -currentMonths));
    const targetPayment = rate === 0 ? balance / targetMonths : (balance * rate) / (1 - Math.pow(1 + rate, -targetMonths));
    
    return Math.max(0, targetPayment - currentPayment);
  };

  const handleTargetYearsChange = (years: number) => {
    setTargetYears(years);
    const overpay = calculateOverpaymentForTarget(years);
    setForm({...form, overpay: Math.round(overpay)});
  };

  return (
    <div className="mt-6">
      <h2 className="text-lg font-semibold mb-4">Thanks! Now let me know how much could you overpay each month.</h2>
      <form className="space-y-6" onSubmit={(e)=>{e.preventDefault(); onNext();}}>
      {/* Input Type Selection */}
      <div>
        <label className="block text-sm font-medium mb-3">Choose how to set your overpayment:</label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            className={`p-3 rounded-xl border text-sm font-medium transition ${
              inputType === 'amount' 
                ? 'border-ink-700 bg-ink-50 text-ink-900' 
                : 'border-slate-200 text-slate-600 hover:border-slate-300'
            }`}
            onClick={() => setInputType('amount')}
          >
            Monthly Amount
          </button>
          <button
            type="button"
            className={`p-3 rounded-xl border text-sm font-medium transition ${
              inputType === 'years' 
                ? 'border-ink-700 bg-ink-50 text-ink-900' 
                : 'border-slate-200 text-slate-600 hover:border-slate-300'
            }`}
            onClick={() => setInputType('years')}
          >
            Target Years
          </button>
        </div>
      </div>

      {/* Monthly Amount Input */}
      {inputType === 'amount' && (
        <div>
          <label className="block text-sm font-medium">Monthly overpayment (£)</label>
          <input 
            type="number" 
            min="0" 
            step="25"
            className="input" 
            value={form.overpay || ''}
            placeholder="0"
            onChange={e=>setForm({...form, overpay:Number(e.target.value) || 0})}
          />
          <p className="mt-1 text-xs text-slate-500">You can change this later — even £25/month helps.</p>
        </div>
      )}

      {/* Target Years Input */}
      {inputType === 'years' && (
        <div>
          <label className="block text-sm font-medium">Pay off mortgage in (years)</label>
          <input 
            type="number" 
            min="1" 
            max="50"
            step="1"
            className="input" 
            value={targetYears}
            onChange={e=>handleTargetYearsChange(Number(e.target.value))}
          />
          <p className="mt-1 text-xs text-slate-500">
            This will calculate the monthly overpayment needed: £{Math.round(calculateOverpaymentForTarget(targetYears)).toLocaleString()}/month
          </p>
        </div>
      )}

        <div className="flex items-center justify-between">
          <button type="button" className="btn-ghost" onClick={onBack}>Back</button>
          <button className="btn-primary" type="submit">Next</button>
        </div>
      </form>
    </div>
  );
}

function Review({ form, onBack, onSave }:{
  form:Form; onBack:()=>void; onSave:()=>void
}) {
  return (
    <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4">
      <h3 className="text-lg font-semibold">Review</h3>
      <dl className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
        <Item k="Balance" v={`£${form.balance.toLocaleString()}`} />
        <Item k="Rate (APR)" v={`${form.rate}%`} />
        <Item k="Term" v={`${form.years}y ${form.months}m`} />
        <Item k="House value" v={`£${form.houseValue.toLocaleString()}`} />
        <Item k="Original mortgage" v={`£${form.originalMortgage.toLocaleString()}`} />
        {form.houseValue > 0 && form.balance > 0 && <Item k="Loan to Value (LTV)" v={`${Math.round((form.balance / form.houseValue) * 100 * 10) / 10}%`} />}
        {form.isTracker ? (
          <Item k="Rate type" v="Tracker mortgage" />
        ) : (
          <Item k="Fixed rate ends" v={`${form.fixedRateEndMonth ? new Date(0, form.fixedRateEndMonth - 1).toLocaleString('default', { month: 'long' }) : ''} ${form.fixedRateEndYear || ''}`} />
        )}
        <Item k="Overpayment" v={form.overpay ? `£${form.overpay}/mo` : '—'} />
      </dl>
      <div className="mt-4 flex items-center justify-between">
        <button className="btn-ghost" onClick={onBack}>Back</button>
        <button className="btn-primary" onClick={onSave}>See my plan</button>
      </div>
    </div>
  );
}

function Item({k,v}:{k:string; v:string}) {
  return <div><dt className="text-slate-500">{k}</dt><dd className="font-medium">{v}</dd></div>;
}
