"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { workflowSchema, stepSchema, ruleSchema } from "@/lib/schemas";
import { workflowApi, stepApi, ruleApi } from "@/lib/api";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { ArrowLeft, Save, Plus, Trash2, GitBranch, ListTree, Settings, Play, ChevronRight, Layout, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import gsap from "gsap";
import { Activity } from "react";
import { Zap } from "lucide-react";

export default function CreateWorkflowWizard() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1); // 1: Info, 2: Steps, 3: Rules
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [workflowId, setWorkflowId] = useState(null);
  const [steps, setSteps] = useState([]);
  const [rules, setRules] = useState([]);
  
  const mainRef = useRef(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const user = JSON.parse(storedUser);
      if (user.role !== "admin") {
        router.push("/dashboard");
      }
    } else {
      router.push("/signin");
    }
  }, [router]);

  useEffect(() => {
    if (mainRef.current) {
        gsap.fromTo(mainRef.current, 
            { opacity: 0, y: 20 }, 
            { opacity: 1, y: 0, duration: 0.6, ease: "power3.out" }
        );
    }
  }, [currentStep]);

  // STEP 1: Workflow Info Form
  const {
    register: regWorkflow,
    handleSubmit: handleWorkflowSubmit,
    control,
    formState: { errors: workflowErrors },
  } = useForm({
    resolver: zodResolver(workflowSchema),
    defaultValues: {
      name: "",
      fields: [{ name: "", type: "string" }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "fields",
  });

  // STEP 2: Step Addition Form
  const {
    register: regStep,
    handleSubmit: handleStepSubmit,
    reset: resetStepForm,
    watch: watchStep,
    formState: { errors: stepErrors },
  } = useForm({
    resolver: zodResolver(stepSchema),
    defaultValues: {
        step_type: "task",
        order: 1
    }
  });

  // STEP 3: Rule Definition Form
  const {
    register: regRule,
    handleSubmit: handleRuleSubmit,
    reset: resetRuleForm,
    formState: { errors: ruleErrors },
  } = useForm({
    resolver: zodResolver(ruleSchema),
    defaultValues: {
        priority: 1
    }
  });

  const onWorkflowSubmit = async (data) => {
    setLoading(true);
    setError("");
    try {
      const input_schema = {};
      data.fields.forEach(f => {
        input_schema[f.name] = f.type;
      });

      const response = await workflowApi.create({
        name: data.name,
        input_schema: JSON.stringify(input_schema)
      });
      setWorkflowId(response.data.id);
      setCurrentStep(2);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create workflow");
    } finally {
      setLoading(false);
    }
  };

  const onAddStep = async (data) => {
    setLoading(true);
    try {
      const response = await stepApi.create(workflowId, {
        ...data,
        metadata: {}
      });
      setSteps([...steps, response.data]);
      resetStepForm({
          name: "",
          step_type: "task",
          order: steps.length + 2
      });
    } catch (err) {
      setError("Failed to add step");
    } finally {
      setLoading(false);
    }
  };

  const onAddRule = async (data) => {
    setLoading(true);
    try {
      const selectedStep = document.getElementById('rule_step_id').value;
      const response = await ruleApi.create(selectedStep, data);
      setRules([...rules, { ...response.data, step_name: steps.find(s => s.id === selectedStep)?.name }]);
      resetRuleForm({
          condition: "",
          next_step_id: "",
          priority: rules.length + 2
      });
    } catch (err) {
      setError("Failed to add rule");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] relative overflow-hidden">
      <Navbar />
      
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[120px] -z-10" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-zinc-100 rounded-full blur-[120px] -z-10" />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div>
                <Link href="/dashboard" className="group inline-flex items-center text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-emerald-600 transition-colors mb-4">
                    <ArrowLeft className="w-3.5 h-3.5 mr-2 group-hover:-translate-x-1 transition-transform" />
                    Back to Archive
                </Link>
                <h1 className="text-4xl font-black text-black tracking-tighter leading-none">
                    Create <span className="text-emerald-500">Workflow</span>
                </h1>
                <p className="text-zinc-500 font-medium text-sm mt-2">Design your automation logic step by step</p>
            </div>

            {/* Stepper */}
            <div className="bg-black p-2 rounded-2xl border border-zinc-800 shadow-2xl flex items-center gap-1">
                {[
                    { n: 1, label: "Blueprint" },
                    { n: 2, label: "Execution" },
                    { n: 3, label: "Logic" }
                ].map((s, i) => (
                    <div key={s.n} className="flex items-center">
                        <div className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
                            currentStep === s.n ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20' : 
                            currentStep > s.n ? 'bg-zinc-800 text-emerald-500' : 'text-zinc-600'
                        }`}>
                            {currentStep > s.n ? <CheckCircle2 className="w-4 h-4" /> : <span className="text-[10px] font-black">{s.n}</span>}
                            <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">{s.label}</span>
                        </div>
                        {i < 2 && <ChevronRight className="w-4 h-4 text-zinc-800 mx-1" />}
                    </div>
                ))}
            </div>
        </div>

        {error && (
            <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-2xl mb-8 animate-in shake duration-500">
                <p className="text-[10px] text-rose-500 font-black uppercase tracking-widest text-center">{error}</p>
            </div>
        )}

        <div ref={mainRef}>
            {/* STEP 1: INITIAL WORKFLOW CREATION */}
            {currentStep === 1 && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 bg-white rounded-[2.5rem] shadow-xl shadow-zinc-200/50 border border-zinc-100 overflow-hidden">
                        <div className="px-10 py-8 border-b border-zinc-50 bg-black">
                            <h2 className="text-xl font-black text-white flex items-center gap-3 tracking-tighter">
                                <Activity className="w-6 h-6 text-emerald-500" />
                                1. The Blueprint
                            </h2>
                        </div>
                        <form className="p-10 space-y-8" onSubmit={handleWorkflowSubmit(onWorkflowSubmit)}>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] ml-1">Process Name</label>
                                <Input
                                    placeholder="e.g. Enterprise Sales Pipeline"
                                    className="h-14 px-6 rounded-2xl border-zinc-100 bg-zinc-50/50 focus:bg-white transition-all shadow-none focus:ring-4 ring-emerald-500/10 border text-lg font-bold"
                                    {...regWorkflow("name")}
                                    error={workflowErrors.name?.message}
                                />
                            </div>
                            
                            <div className="space-y-6">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-[10px] font-black text-black uppercase tracking-widest">Input Parameters</h3>
                                    <Button 
                                        type="button" 
                                        variant="secondary" 
                                        size="sm" 
                                        onClick={() => append({ name: "", type: "string" })}
                                        className="h-10 px-4 rounded-xl gap-2 font-black border-zinc-800 bg-black text-white hover:bg-zinc-900 transition-all active:scale-95"
                                    >
                                        <Plus className="w-4 h-4 text-emerald-500" /> Add Field
                                    </Button>
                                </div>
                                
                                <div className="space-y-4">
                                    {fields.map((field, index) => (
                                        <div key={field.id} className="group flex flex-col sm:flex-row gap-3 items-start sm:items-end animate-in fade-in slide-in-from-top-2 duration-300">
                                            <div className="flex-1 w-full">
                                                <Input
                                                    placeholder="Field Key (e.g. amount)"
                                                    className="h-12 px-6 rounded-xl border-zinc-100 bg-zinc-50/50 focus:bg-white transition-all"
                                                    {...regWorkflow(`fields.${index}.name`)}
                                                />
                                            </div>
                                            <div className="w-full sm:w-40">
                                                <select
                                                    className="w-full h-12 px-4 bg-zinc-50/50 border border-zinc-100 rounded-xl text-[10px] font-black uppercase tracking-widest text-black focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all cursor-pointer"
                                                    {...regWorkflow(`fields.${index}.type`)}
                                                >
                                                    <option value="string">String</option>
                                                    <option value="number">Number</option>
                                                    <option value="boolean">Boolean</option>
                                                </select>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => remove(index)}
                                                className="p-3 text-zinc-300 hover:text-rose-500 transition-colors bg-zinc-50 sm:bg-transparent rounded-xl sm:rounded-none w-full sm:w-auto flex justify-center"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                    ))}
                                    {fields.length === 0 && (
                                        <div className="text-center py-10 bg-zinc-50/50 rounded-3xl border-2 border-dashed border-zinc-100">
                                            <p className="text-zinc-400 text-[10px] font-black uppercase tracking-widest">Awaiting field definitions</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex justify-end pt-6">
                                <Button type="submit" disabled={loading} className="h-14 px-8 rounded-2xl bg-black hover:bg-zinc-900 text-white font-black uppercase tracking-widest text-[10px] transition-all hover:-translate-y-1 shadow-xl shadow-zinc-200 gap-3 border border-zinc-800">
                                    Next: Define Execution <ChevronRight className="w-4 h-4 text-emerald-500" />
                                </Button>
                            </div>
                        </form>
                    </div>

                    <div className="space-y-6">
                        <div className="bg-black p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden border border-zinc-800">
                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                <Zap className="w-16 h-16 text-emerald-500" />
                            </div>
                            <h3 className="text-[10px] font-black uppercase tracking-widest mb-4 text-emerald-500">Pro Tip</h3>
                            <p className="text-white text-xs leading-relaxed font-bold">
                                Define your input schema carefully. These fields will be available for routing rules and step processing later.
                            </p>
                        </div>
                        <div className="bg-white p-8 rounded-[2.5rem] border border-zinc-100 shadow-sm">
                            <h3 className="text-[10px] font-black text-black uppercase tracking-widest mb-6">Workflow Anatomy</h3>
                            <div className="space-y-6">
                                <div className="flex gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-black flex items-center justify-center shrink-0">
                                        <Activity className="w-5 h-5 text-emerald-500" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-black uppercase tracking-widest">Blueprint</p>
                                        <p className="text-[11px] text-zinc-500 font-bold uppercase transition-all">Metadata & Input Schema</p>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-black flex items-center justify-center shrink-0">
                                        <ListTree className="w-5 h-5 text-emerald-500" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-black uppercase tracking-widest">Execution</p>
                                        <p className="text-[11px] text-zinc-500 font-bold uppercase">Chain of automated steps</p>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-black flex items-center justify-center shrink-0">
                                        <Settings className="w-5 h-5 text-emerald-500" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-black uppercase tracking-widest">Logic</p>
                                        <p className="text-[11px] text-zinc-500 font-bold uppercase">Dynamic routing rules</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* STEP 2: ADDING STEPS */}
            {currentStep === 2 && (
                <div className="space-y-8">
                    <div className="bg-white rounded-[2.5rem] shadow-xl shadow-zinc-200/50 border border-zinc-100 overflow-hidden">
                        <div className="px-10 py-8 border-b border-zinc-50 bg-black flex justify-between items-center">
                            <h2 className="text-xl font-black text-white flex items-center gap-3 tracking-tighter">
                                <ListTree className="w-6 h-6 text-emerald-500" />
                                2. Execution Chain
                            </h2>
                            <div className="bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
                                <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">{steps.length} Steps</span>
                            </div>
                        </div>
                        
                        <div className="p-10">
                            <form className="bg-zinc-50/50 p-8 rounded-[2rem] border border-zinc-100 mb-8" onSubmit={handleStepSubmit(onAddStep)}>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6 items-end">
                                    <div className="lg:col-span-4 space-y-2">
                                        <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] ml-1">Step Name</label>
                                        <Input 
                                            placeholder="e.g. Audit Payment" 
                                            className="h-12 px-6 rounded-xl border-zinc-100 bg-white" 
                                            {...regStep("name")} 
                                            error={stepErrors.name?.message} 
                                        />
                                    </div>
                                    <div className="lg:col-span-3 space-y-2">
                                        <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] ml-1">Behavior</label>
                                        <select className="w-full h-12 px-4 bg-white border border-zinc-100 rounded-xl text-[10px] font-black uppercase tracking-widest text-black outline-none transition-all cursor-pointer" {...regStep("step_type")}>
                                            <option value="task">Automated Task</option>
                                            <option value="approval">Human Approval</option>
                                            <option value="notification">Email Notification</option>
                                        </select>
                                    </div>
                                    
                                    {["approval", "notification"].includes(watchStep("step_type")) ? (
                                        <div className="lg:col-span-3 space-y-2 animate-in fade-in slide-in-from-top-2">
                                            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] ml-1">
                                                {watchStep("step_type") === "approval" ? "Reviewer Email" : "Recipient Email"}
                                            </label>
                                            <Input 
                                                placeholder="ops@engine.io" 
                                                className="h-12 px-6 rounded-xl border-zinc-100 bg-white" 
                                                {...regStep("approver_email")} 
                                                error={stepErrors.approver_email?.message} 
                                            />
                                        </div>
                                    ) : null}
                                    
                                    <div className={`${["approval", "notification"].includes(watchStep("step_type")) ? "lg:col-span-2" : "lg:col-span-5"}`}>
                                        <Button type="submit" disabled={loading} className="w-full h-12 rounded-xl bg-black hover:bg-zinc-900 text-white font-black uppercase tracking-widest text-[10px] gap-2 shadow-lg shadow-zinc-200 border border-zinc-800">
                                            <Plus className="w-4 h-4 text-emerald-500" /> Add Step
                                        </Button>
                                    </div>
                                </div>
                            </form>

                            <div className="space-y-4">
                                {steps.length === 0 ? (
                                    <div className="text-center py-20 border-2 border-dashed border-zinc-100 rounded-[2.5rem]">
                                        <div className="w-16 h-16 bg-zinc-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                            <ListTree className="w-8 h-8 text-zinc-200" />
                                        </div>
                                        <p className="text-zinc-400 text-[10px] font-black uppercase tracking-widest">Awaiting execution sequence</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {steps.map((s, i) => (
                                            <div key={s.id} className="group flex items-center justify-between p-6 bg-white border border-zinc-100 rounded-2xl shadow-sm hover:border-emerald-500/50 hover:shadow-lg hover:shadow-emerald-500/5 transition-all animate-in slide-in-from-left-4 duration-300">
                                                <div className="flex items-center gap-5">
                                                    <div className="bg-black text-emerald-500 font-black w-10 h-10 rounded-xl flex items-center justify-center text-xs border border-zinc-800">
                                                        {i + 1}
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-3">
                                                            <p className="font-black text-black tracking-tighter text-lg">{s.name}</p>
                                                            <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full uppercase tracking-widest border border-emerald-100">
                                                                {s.step_type}
                                                            </span>
                                                        </div>
                                                        {s.approver_email && (
                                                            <p className="text-[10px] text-zinc-400 font-black uppercase tracking-widest mt-1 italic">{s.approver_email}</p>
                                                        )}
                                                    </div>
                                                </div>
                                                <button onClick={() => setSteps(steps.filter(x => x.id !== s.id))} className="w-10 h-10 flex items-center justify-center rounded-xl bg-zinc-50 text-zinc-300 hover:text-rose-500 hover:bg-rose-50 transition-all">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="px-10 py-8 border-t border-zinc-50 bg-zinc-50/30 flex justify-end">
                            <Button onClick={() => setCurrentStep(3)} disabled={steps.length < 1} className="h-14 px-8 rounded-2xl bg-black hover:bg-zinc-900 border border-zinc-800 text-white font-black uppercase tracking-widest text-[10px] gap-3 shadow-xl shadow-zinc-200" variant="primary">
                                Next: Define Logic <ArrowLeft className="w-4 h-4 rotate-180 text-emerald-500" />
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* STEP 3: DEFINING RULES */}
            {currentStep === 3 && (
                <div className="space-y-8">
                    <div className="bg-white rounded-[2.5rem] shadow-xl shadow-zinc-200/50 border border-zinc-100 overflow-hidden">
                        <div className="px-10 py-8 border-b border-zinc-50 bg-black">
                            <h2 className="text-xl font-black text-white flex items-center gap-3 tracking-tighter">
                                <Settings className="w-6 h-6 text-emerald-500" />
                                3. Intelligent Routing
                            </h2>
                        </div>
                        
                        <div className="p-10">
                            <form className="bg-zinc-50/50 p-8 rounded-[2rem] border border-zinc-100 mb-8" onSubmit={handleRuleSubmit(onAddRule)}>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6 items-end">
                                    <div className="lg:col-span-3 space-y-2">
                                        <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] ml-1">From Step</label>
                                        <select id="rule_step_id" className="w-full h-12 px-4 bg-white border border-zinc-100 rounded-xl text-[10px] font-black uppercase tracking-widest text-black outline-none">
                                            {steps.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="lg:col-span-3 space-y-2">
                                        <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] ml-1">Condition</label>
                                        <Input 
                                            placeholder="e.g. amount > 500" 
                                            className="h-12 px-6 rounded-xl border-zinc-100 bg-white" 
                                            {...regRule("condition")} 
                                        />
                                    </div>
                                    <div className="lg:col-span-3 space-y-2">
                                        <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] ml-1">Transition To</label>
                                        <select className="w-full h-12 px-4 bg-white border border-zinc-100 rounded-xl text-[10px] font-black uppercase tracking-widest text-black outline-none" {...regRule("next_step_id")}>
                                            <option value="">🏁 Terminate Flow</option>
                                            {steps.map(s => <option key={s.id} value={s.id}>↳ {s.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="lg:col-span-3">
                                        <Button type="submit" disabled={loading} className="w-full h-12 rounded-xl bg-black hover:bg-zinc-900 text-white font-black uppercase tracking-widest text-[10px] gap-2 transition-all hover:-translate-y-1 border border-zinc-800 shadow-xl shadow-zinc-200">
                                            <Plus className="w-4 h-4 text-emerald-500" /> Add Rule
                                        </Button>
                                    </div>
                                </div>
                                <div className="mt-4 flex items-center gap-2 opacity-50">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Use "DEFAULT" for the fallback path</span>
                                </div>
                            </form>

                            <div className="space-y-4">
                                {rules.length === 0 ? (
                                    <div className="text-center py-20 border-2 border-dashed border-zinc-100 rounded-[2.5rem]">
                                        <div className="w-16 h-16 bg-zinc-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                            <GitBranch className="w-8 h-8 text-zinc-200" />
                                        </div>
                                        <p className="text-zinc-400 text-[10px] font-black uppercase tracking-widest">Awaiting logic definitions</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {rules.map((r, i) => (
                                            <div key={i} className="group relative p-6 bg-white border border-zinc-100 rounded-2xl shadow-sm hover:border-emerald-500/50 hover:shadow-lg transition-all animate-in zoom-in-95 duration-300">
                                                <div className="flex justify-between items-start mb-4">
                                                    <div className="bg-black border border-zinc-800 text-emerald-500 text-[9px] font-black px-2 py-1 rounded-md tracking-widest uppercase shadow-lg shadow-emerald-500/10">Rule P{r.priority}</div>
                                                    <button onClick={() => setRules(rules.filter((_, idx) => idx !== i))} className="text-zinc-300 hover:text-rose-500 transition-colors">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                                <div className="space-y-3">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest w-12 flex-shrink-0">Source</span>
                                                        <span className="text-[11px] font-black text-black bg-zinc-50 px-2 py-1.5 rounded-lg border border-zinc-100 flex-1 truncate">{r.step_name}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest w-12 flex-shrink-0">Check</span>
                                                        <code className="text-[10px] font-black text-emerald-600 bg-emerald-50/50 px-2 py-1.5 rounded-lg border border-emerald-100 flex-1 truncate">"{r.condition}"</code>
                                                    </div>
                                                    <div className="flex items-center gap-2 pt-2 border-t border-zinc-50">
                                                        <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest w-12 flex-shrink-0">Goto</span>
                                                        <span className={`text-[11px] font-black px-2 py-1.5 rounded-lg border flex-1 truncate ${r.next_step_id ? 'text-black bg-zinc-100 border-zinc-200' : 'text-zinc-400 bg-zinc-50 border-zinc-100'}`}>
                                                            {steps.find(s => s.id === r.next_step_id)?.name || '🏁 Terminate'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                        
                        <div className="px-10 py-8 border-t border-zinc-50 bg-zinc-50/30 flex justify-end">
                            <Button onClick={() => router.push('/dashboard')} className="h-16 px-12 rounded-2xl bg-black hover:bg-zinc-900 border border-emerald-500/20 text-emerald-500 font-black transition-all hover:scale-105 active:scale-95 shadow-2xl shadow-emerald-500/20 gap-3 uppercase tracking-[0.2em] text-[10px]">
                                Initialize Flow <Play className="w-4 h-4 fill-current" />
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
      </main>
    </div>
  );
}
