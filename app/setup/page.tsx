"use client";
import { useState } from "react";

type Form = { balance:number; rate:number; years:number; months:number; overpay?:number; penaltyLimit?:number };

export default function SetupPage() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<Form>({ balance: 0, rate: 0, years: 25, months: 0, overpay: 0, penaltyLimit: 10 });

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
    <form className="mt-6 space-y-4" onSubmit={(e)=>{e.preventDefault(); onNext();}}>
      <div>
        <label className="block text-sm font-medium">Mortgage balance (£)</label>
        <input type="number" inputMode="decimal" required className="input" value={form.balance || ''}
               onChange={e=>setForm({...form, balance:Number(e.target.value)})}/>
        <p className="mt-1 text-xs text-slate-500">Enter the remaining balance, not original loan.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium">Interest rate (APR %)</label>
          <input type="number" step="0.01" required className="input" value={form.rate || ''}
                 onChange={e=>setForm({...form, rate:Number(e.target.value)})}/>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium">Years</label>
            <input type="number" min="0" className="input" value={form.years || ''}
                   onChange={e=>setForm({...form, years:Number(e.target.value)})}/>
          </div>
          <div>
            <label className="block text-sm font-medium">Months</label>
            <input type="number" min="0" max="11" className="input" value={form.months || ''}
                   onChange={e=>setForm({...form, months:Number(e.target.value)})}/>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium">Overpayment penalty limit (%)</label>
        <input type="number" min="0" max="100" step="0.1" className="input" value={form.penaltyLimit || ''}
               onChange={e=>setForm({...form, penaltyLimit:Number(e.target.value)})}/>
        <p className="mt-1 text-xs text-slate-500">Most UK mortgages allow 10% overpayment per year without penalty.</p>
      </div>

      <div className="flex justify-end">
        <button className="btn-primary" type="submit">Next</button>
      </div>
    </form>
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
    <form className="mt-6 space-y-6" onSubmit={(e)=>{e.preventDefault(); onNext();}}>
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
        <Item k="Penalty-free limit" v={`${form.penaltyLimit || 10}% per year`} />
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
