"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { workflowSchema, stepSchema, ruleSchema } from "@/lib/schemas";
import { workflowApi, stepApi, ruleApi } from "@/lib/api";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useRouter, useParams } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import Navbar from "@/components/Navbar";
import { ArrowLeft, Save, Plus, Trash2, GitBranch, ListTree, Settings, Play, Loader2, CheckCircle2, ChevronRight, Layout, Edit3, Activity } from "lucide-react";
import Link from "next/link";
import gsap from "gsap";

export default function EditWorkflowWizard() {
  const router = useRouter();
  const { id } = useParams();
  const [currentStep, setCurrentStep] = useState(1); // 1: Info, 2: Steps, 3: Rules
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [steps, setSteps] = useState([]);
  const [rules, setRules] = useState([]);
  
  const mainRef = useRef(null);

  // Inline editing state
  const [editingStepId, setEditingStepId] = useState(null);
  const [editStepDraft, setEditStepDraft] = useState({});
  const [editingRuleId, setEditingRuleId] = useState(null);
  const [editRuleDraft, setEditRuleDraft] = useState({});

  // STEP 1: Workflow Info Form
  const {
    register: regWorkflow,
    handleSubmit: handleWorkflowSubmit,
    control,
    reset: resetWorkflow,
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

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await workflowApi.getById(id);
        const { workflow, steps: fetchedSteps, rules: fetchedRules } = response.data;
        
        const schema = typeof workflow.input_schema === 'string' 
            ? JSON.parse(workflow.input_schema) 
            : workflow.input_schema;
        
        const fieldsArray = Object.keys(schema).map(key => ({
            name: key,
            type: schema[key]
        }));

        resetWorkflow({
            name: workflow.name,
            fields: fieldsArray
        });

        setSteps(fetchedSteps);
        
        const rulesWithNames = fetchedRules.map(r => ({
            ...r,
            step_name: fetchedSteps.find(s => s.id === r.step_id)?.name
        }));
        setRules(rulesWithNames);

      } catch (err) {
        setError("Failed to fetch workflow data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, resetWorkflow]);

  useEffect(() => {
    if (!loading && mainRef.current) {
        gsap.fromTo(mainRef.current, 
            { opacity: 0, y: 20 }, 
            { opacity: 1, y: 0, duration: 0.6, ease: "power3.out" }
        );
    }
  }, [currentStep, loading]);

  const onWorkflowUpdate = async (data) => {
    setSaving(true);
    setError("");
    try {
      const input_schema = {};
      data.fields.forEach(f => {
        input_schema[f.name] = f.type;
      });

      await workflowApi.update(id, {
        name: data.name,
        input_schema: JSON.stringify(input_schema)
      });
      setCurrentStep(2);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update workflow");
    } finally {
      setSaving(false);
    }
  };

  const onAddStep = async (data) => {
    setSaving(true);
    try {
      const response = await stepApi.create(id, {
        ...data,
        metadata: {}
      });
      const newSteps = [...steps, response.data];
      setSteps(newSteps);
      resetStepForm({
          name: "",
          step_type: "task",
          order: newSteps.length + 1
      });
    } catch (err) {
      setError("Failed to add step");
    } finally {
      setSaving(false);
    }
  };

  const onDeleteStep = async (stepId) => {
      try {
          await stepApi.delete(stepId);
          setSteps(steps.filter(s => s.id !== stepId));
          setRules(rules.filter(r => r.step_id !== stepId));
      } catch (err) {
          setError("Failed to delete step");
      }
  };

  const onAddRule = async (data) => {
    setSaving(true);
    try {
      const selectedStep = document.getElementById('rule_step_id').value;
      const response = await ruleApi.create(selectedStep, data);
      
      setRules([...rules, { 
          ...response.data, 
          step_name: steps.find(s => s.id === selectedStep)?.name 
      }]);
      
      resetRuleForm({
          condition: "",
          next_step_id: "",
          priority: rules.length + 2
      });
    } catch (err) {
      setError("Failed to add rule");
    } finally {
      setSaving(false);
    }
  };

  const onDeleteRule = async (ruleId) => {
      try {
          await ruleApi.delete(ruleId);
          setRules(rules.filter(r => r.id !== ruleId));
      } catch (err) {
          setError("Failed to delete rule");
      }
  };

  if (loading) {
      return (
          <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center gap-4">
              <div className="w-16 h-16 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" />
              <p className="text-gray-400 font-black uppercase tracking-[0.2em] text-xs">Syncing Engine Data...</p>
          </div>
      );
  }

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
                    Discard Changes
                </Link>
                <h1 className="text-4xl font-black text-black tracking-tighter leading-none">
                    Edit <span className="text-emerald-500">Workflow</span>
                </h1>
                <p className="text-zinc-500 font-medium text-sm mt-2">Modify your existing automation architecture</p>
            </div>

            {/* Stepper */}
            <div className="bg-black p-2 rounded-2xl border border-zinc-800 shadow-2xl flex items-center gap-1">
                {[
                    { n: 1, label: "Blueprint" },
                    { n: 2, label: "Execution" },
                    { n: 3, label: "Logic" }
                ].map((s, i) => (
                    <div key={s.n} className="flex items-center cursor-pointer" onClick={() => setCurrentStep(s.n)}>
                        <div className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
                            currentStep === s.n ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20' : 
                            'text-zinc-600 hover:text-emerald-500 hover:bg-zinc-900'
                        }`}>
                            <span className="text-[10px] font-black">{s.n}</span>
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
            {/* STEP 1: INFO */}
            {currentStep === 1 && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 bg-white rounded-[2.5rem] shadow-xl shadow-zinc-200/50 border border-zinc-100 overflow-hidden">
                        <div className="px-10 py-8 border-b border-zinc-50 bg-black">
                            <h2 className="text-xl font-black text-white flex items-center gap-3 tracking-tighter">
                                <Activity className="w-6 h-6 text-emerald-500" />
                                Blueprint Configuration
                            </h2>
                        </div>
                        <form className="p-10 space-y-8" onSubmit={handleWorkflowSubmit(onWorkflowUpdate)}>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] ml-1">Process Name</label>
                                <Input
                                    placeholder="e.g. Sales Pipeline"
                                    className="h-14 px-6 rounded-2xl border-zinc-100 bg-zinc-50/50 focus:bg-white transition-all text-lg font-bold"
                                    {...regWorkflow("name")}
                                    error={workflowErrors.name?.message}
                                />
                            </div>
                            
                            <div className="space-y-6">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-[10px] font-black text-black uppercase tracking-widest">Global Variables</h3>
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
                                
                                <div className="grid grid-cols-1 gap-4">
                                    {fields.map((field, index) => (
                                        <div key={field.id} className="group flex flex-col sm:flex-row gap-3 items-start sm:items-end animate-in fade-in slide-in-from-top-2 duration-300">
                                            <div className="flex-1 w-full">
                                                <Input
                                                    placeholder="Variable Name"
                                                    className="h-12 px-6 rounded-xl border-zinc-100 bg-zinc-50/50 focus:bg-white"
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
                                </div>
                            </div>

                            <div className="flex justify-end pt-4 border-t border-zinc-50">
                                <Button type="submit" disabled={saving} className="h-14 px-8 rounded-2xl bg-black hover:bg-zinc-900 text-white font-black uppercase tracking-widest text-[10px] transition-all shadow-xl shadow-zinc-200 gap-3 border border-zinc-800">
                                    {saving ? <Loader2 className="w-4 h-4 animate-spin text-emerald-500" /> : <Save className="w-4 h-4 text-emerald-500" />}
                                    Sync Blueprint
                                </Button>
                            </div>
                        </form>
                    </div>

                    <div className="space-y-6">
                        <div className="bg-white p-8 rounded-[2.5rem] border border-zinc-100 shadow-sm">
                            <h3 className="text-[10px] font-black text-black uppercase tracking-widest mb-4">Summary</h3>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center py-2 border-b border-zinc-50">
                                    <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">Process ID</span>
                                    <span className="text-[10px] font-black text-zinc-600 bg-zinc-100 px-2 py-0.5 rounded uppercase tracking-widest">{id.substring(0,8)}</span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b border-zinc-50">
                                    <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">Active Nodes</span>
                                    <span className="text-xs font-black text-emerald-600">{steps.length}</span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b border-zinc-50">
                                    <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">Logic Rules</span>
                                    <span className="text-xs font-black text-black">{rules.length}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* STEP 2: STEPS */}
            {currentStep === 2 && (
                <div className="space-y-8">
                    <div className="bg-white rounded-[2.5rem] shadow-xl shadow-zinc-200/50 border border-zinc-100 overflow-hidden">
                        <div className="px-10 py-8 border-b border-zinc-50 bg-black flex justify-between items-center">
                            <h2 className="text-xl font-black text-white flex items-center gap-3 tracking-tighter">
                                <ListTree className="w-6 h-6 text-emerald-500" />
                                Execution Engine
                            </h2>
                            <div className="bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
                                <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">{steps.length} Nodes</span>
                            </div>
                        </div>
                        
                        <div className="p-10">
                            <form className="bg-zinc-50/50 p-8 rounded-[2rem] border border-zinc-100 mb-8" onSubmit={handleStepSubmit(onAddStep)}>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6 items-end">
                                    <div className="lg:col-span-4 space-y-2">
                                        <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] ml-1">New Node Name</label>
                                        <Input 
                                            placeholder="e.g. Verify Compliance" 
                                            className="h-12 px-6 rounded-xl border-zinc-100 bg-white" 
                                            {...regStep("name")} 
                                            error={stepErrors.name?.message} 
                                        />
                                    </div>
                                    <div className="lg:col-span-3 space-y-2">
                                        <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] ml-1">Type</label>
                                        <select className="w-full h-12 px-4 bg-white border border-zinc-100 rounded-xl text-[10px] font-black uppercase tracking-widest text-black outline-none cursor-pointer" {...regStep("step_type")}>
                                            <option value="task">Automated Task</option>
                                            <option value="approval">Human Approval</option>
                                            <option value="notification">Email Notification</option>
                                        </select>
                                    </div>
                                    {["approval", "notification"].includes(watchStep("step_type")) && (
                                        <div className="lg:col-span-3 space-y-2 animate-in fade-in slide-in-from-top-2">
                                            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] ml-1">Contact Email</label>
                                            <Input 
                                                placeholder="ops@engine.io" 
                                                className="h-12 px-6 rounded-xl border-zinc-100 bg-white" 
                                                {...regStep("approver_email")} 
                                                error={stepErrors.approver_email?.message} 
                                            />
                                        </div>
                                    )}
                                    <div className={`${["approval", "notification"].includes(watchStep("step_type")) ? "lg:col-span-2" : "lg:col-span-5"}`}>
                                        <Button type="submit" disabled={saving} className="w-full h-12 rounded-xl bg-black hover:bg-zinc-900 border border-zinc-800 text-white font-black uppercase tracking-widest text-[10px] gap-2 shadow-lg shadow-zinc-200">
                                            <Plus className="w-4 h-4 text-emerald-500" /> Add Node
                                        </Button>
                                    </div>
                                </div>
                            </form>

                            <div className="space-y-4">
                                {steps.sort((a,b) => a.order - b.order).map((s, i) => (
                                    <div key={s.id} className="group flex flex-col p-6 bg-white border border-zinc-100 rounded-2xl shadow-sm hover:border-emerald-500/50 hover:shadow-lg transition-all">
                                        {editingStepId === s.id ? (
                                            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end animate-in zoom-in-95 duration-200">
                                                <div className="md:col-span-4 space-y-2">
                                                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] ml-1">Node Name</label>
                                                    <Input 
                                                        className="h-12 px-6 rounded-xl border-zinc-100 bg-zinc-50/50"
                                                        value={editStepDraft.name} 
                                                        onChange={(e) => setEditStepDraft({ ...editStepDraft, name: e.target.value })} 
                                                    />
                                                </div>
                                                <div className="md:col-span-3 space-y-2">
                                                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] ml-1">Type</label>
                                                    <select 
                                                        className="w-full h-12 px-4 bg-zinc-50/50 border border-zinc-100 rounded-xl text-[10px] font-black uppercase tracking-widest text-black outline-none"
                                                        value={editStepDraft.step_type}
                                                        onChange={(e) => setEditStepDraft({ ...editStepDraft, step_type: e.target.value })}
                                                    >
                                                        <option value="task">Automated Task</option>
                                                        <option value="approval">Human Approval</option>
                                                        <option value="notification">Email Notification</option>
                                                    </select>
                                                </div>
                                                {["approval", "notification"].includes(editStepDraft.step_type) && (
                                                    <div className="md:col-span-3 space-y-2">
                                                        <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] ml-1">Contact Email</label>
                                                        <Input 
                                                            className="h-12 px-6 rounded-xl border-zinc-100 bg-zinc-50/50"
                                                            value={editStepDraft.approver_email || ""} 
                                                            onChange={(e) => setEditStepDraft({ ...editStepDraft, approver_email: e.target.value })} 
                                                        />
                                                    </div>
                                                )}
                                                <div className={`${["approval", "notification"].includes(editStepDraft.step_type) ? "md:col-span-2" : "md:col-span-5"} flex gap-2`}>
                                                    <Button size="sm" className="h-12 rounded-xl flex-1 bg-black text-emerald-500 font-black uppercase tracking-widest text-[10px] border border-emerald-500/20 shadow-lg shadow-emerald-500/10" onClick={async () => {
                                                        const updatedSteps = steps.map(step => step.id === s.id ? {...step, ...editStepDraft} : step);
                                                        setSteps(updatedSteps);
                                                        await stepApi.update(s.id, editStepDraft);
                                                        setEditingStepId(null);
                                                    }}>Commit</Button>
                                                    <Button size="sm" variant="ghost" className="h-12 rounded-xl px-4 text-zinc-400 font-black uppercase tracking-widest text-[10px]" onClick={() => setEditingStepId(null)}>Cancel</Button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-5">
                                                    <div className="bg-black text-emerald-500 font-black w-10 h-10 rounded-xl flex items-center justify-center text-xs border border-zinc-800">
                                                        #{i + 1}
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
                                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                                    <button 
                                                        onClick={() => {
                                                            setEditingStepId(s.id);
                                                            setEditStepDraft({ name: s.name, step_type: s.step_type, order: s.order, metadata: s.metadata, approver_email: s.approver_email });
                                                        }}
                                                        className="w-10 h-10 flex items-center justify-center rounded-xl bg-zinc-50 text-zinc-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all border border-transparent hover:border-emerald-100"
                                                    >
                                                        <Edit3 className="w-4 h-4" />
                                                    </button>
                                                    <button 
                                                        onClick={() => onDeleteStep(s.id)}
                                                        className="w-10 h-10 flex items-center justify-center rounded-xl bg-zinc-50 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 transition-all border border-transparent hover:border-rose-100"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="px-10 py-8 border-t border-zinc-50 bg-zinc-50/30 flex justify-end">
                            <Button onClick={() => setCurrentStep(3)} className="h-14 px-10 rounded-2xl bg-black hover:bg-zinc-900 border border-zinc-800 text-white font-black uppercase tracking-widest text-[10px] gap-3 shadow-xl shadow-zinc-200">
                                Next: Routing Rules <ArrowLeft className="w-4 h-4 rotate-180 text-emerald-500" />
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* STEP 3: RULES */}
            {currentStep === 3 && (
                <div className="space-y-8">
                    <div className="bg-white rounded-[2.5rem] shadow-xl shadow-zinc-200/50 border border-zinc-100 overflow-hidden">
                        <div className="px-10 py-8 border-b border-zinc-50 bg-black">
                            <h2 className="text-xl font-black text-white flex items-center gap-3 tracking-tighter">
                                <Settings className="w-6 h-6 text-emerald-500" />
                                Intelligent Switching
                            </h2>
                        </div>
                        
                        <div className="p-10">
                            <form className="bg-zinc-50/50 p-8 rounded-[2rem] border border-zinc-100 mb-8" onSubmit={handleRuleSubmit(onAddRule)}>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6 items-end">
                                    <div className="lg:col-span-3 space-y-2">
                                        <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] ml-1">Source Node</label>
                                        <select id="rule_step_id" className="w-full h-12 px-4 bg-white border border-zinc-100 rounded-xl text-[10px] font-black uppercase tracking-widest text-black outline-none">
                                            {steps.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="lg:col-span-3 space-y-2">
                                        <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] ml-1">Condition</label>
                                        <Input 
                                            placeholder="e.g. status === 'premium'" 
                                            className="h-12 px-6 rounded-xl border-zinc-100 bg-white" 
                                            {...regRule("condition")} 
                                        />
                                    </div>
                                    <div className="lg:col-span-3 space-y-2">
                                        <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] ml-1">Target Node</label>
                                        <select className="w-full h-12 px-4 bg-white border border-zinc-100 rounded-xl text-[10px] font-black uppercase tracking-widest text-black outline-none" {...regRule("next_step_id")}>
                                            <option value="">🏁 Finalize Process</option>
                                            {steps.map(s => <option key={s.id} value={s.id}>↳ {s.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="lg:col-span-3">
                                        <Button type="submit" disabled={saving} className="w-full h-12 rounded-xl bg-black hover:bg-zinc-900 border border-zinc-800 text-white font-black uppercase tracking-widest text-[10px] gap-2 shadow-lg shadow-zinc-200">
                                            <Plus className="w-4 h-4 text-emerald-500" /> Add Rule
                                        </Button>
                                    </div>
                                </div>
                            </form>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {rules.map((r, i) => (
                                    <div key={r.id || i} className="group relative p-6 bg-white border border-zinc-100 rounded-2xl shadow-sm hover:border-emerald-500/50 transition-all">
                                        {editingRuleId === r.id ? (
                                            <div className="space-y-4 animate-in zoom-in-95 duration-200">
                                                <Input 
                                                    className="h-12 px-6 rounded-xl border-zinc-100 bg-zinc-50/50"
                                                    value={editRuleDraft.condition} 
                                                    onChange={(e) => setEditRuleDraft({ ...editRuleDraft, condition: e.target.value })} 
                                                />
                                                <select 
                                                    className="w-full h-12 px-4 bg-zinc-50/50 border border-zinc-100 rounded-xl text-[10px] font-black uppercase tracking-widest text-black outline-none"
                                                    value={editRuleDraft.next_step_id || ""}
                                                    onChange={(e) => setEditRuleDraft({ ...editRuleDraft, next_step_id: e.target.value || null })}
                                                >
                                                    <option value="">🏁 Finalize Process</option>
                                                    {steps.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                                </select>
                                                <div className="flex gap-2 pt-2">
                                                    <Button className="h-12 rounded-xl flex-1 bg-black text-emerald-500 font-black uppercase tracking-widest text-[10px] border border-emerald-500/20 shadow-lg shadow-emerald-500/10" onClick={async () => {
                                                        const updatedRules = rules.map(rule => rule.id === r.id ? {...rule, ...editRuleDraft} : rule);
                                                        setRules(updatedRules);
                                                        await ruleApi.update(r.id, editRuleDraft);
                                                        setEditingRuleId(null);
                                                    }}>Update</Button>
                                                    <Button variant="ghost" className="h-12 rounded-xl px-6 text-zinc-400 font-black uppercase tracking-widest text-[10px]" onClick={() => setEditingRuleId(null)}>Cancel</Button>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="flex justify-between items-start mb-4">
                                                    <div className="bg-black border border-zinc-800 text-emerald-500 text-[9px] font-black px-2 py-1 rounded-md tracking-widest uppercase shadow-lg shadow-emerald-500/10">Rule P{r.priority}</div>
                                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                                        <button 
                                                            onClick={() => {
                                                                setEditingRuleId(r.id);
                                                                setEditRuleDraft({ condition: r.condition, next_step_id: r.next_step_id, priority: r.priority });
                                                            }}
                                                            className="p-1.5 text-zinc-400 hover:text-emerald-600 transition-colors"
                                                        >
                                                            <Edit3 className="w-4 h-4" />
                                                        </button>
                                                        <button 
                                                            onClick={() => onDeleteRule(r.id)}
                                                            className="p-1.5 text-zinc-400 hover:text-rose-600 transition-colors"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className="space-y-4">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest w-12 shrink-0">In</span>
                                                        <span className="text-[11px] font-black text-black bg-zinc-50 px-3 py-1.5 rounded-xl border border-zinc-100 flex-1 truncate">{r.step_name}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest w-12 shrink-0">Check</span>
                                                        <code className="text-[10px] font-black text-emerald-600 bg-emerald-50/50 px-3 py-1.5 rounded-xl border border-emerald-100 flex-1 truncate">"{r.condition}"</code>
                                                    </div>
                                                    <div className="flex items-center gap-2 pt-3 border-t border-zinc-50">
                                                        <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest w-12 shrink-0">Out</span>
                                                        <span className={`text-[11px] font-black px-3 py-1.5 rounded-xl border flex-1 truncate ${r.next_step_id ? 'text-black bg-zinc-100 border-zinc-200' : 'text-zinc-400 bg-zinc-50 border-zinc-100'}`}>
                                                            {steps.find(s => s.id === r.next_step_id)?.name || '🏁 Process Terminated'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                ))}
                                {rules.length === 0 && (
                                    <div className="col-span-full text-center py-20 border-2 border-dashed border-zinc-100 rounded-[2.5rem]">
                                        <p className="text-zinc-400 text-[10px] font-black uppercase tracking-widest">Logic sequence currently linear</p>
                                    </div>
                                )}
                            </div>
                        </div>
                        
                        <div className="px-10 py-8 border-t border-zinc-50 bg-zinc-50/30 flex justify-end">
                            <Button onClick={() => router.push('/dashboard')} className="h-16 px-12 rounded-2xl bg-black hover:bg-zinc-900 border border-emerald-500/20 text-emerald-500 font-black transition-all hover:scale-105 active:scale-95 shadow-2xl shadow-emerald-500/20 gap-3 uppercase tracking-[0.2em] text-[10px]">
                                Finalize Updates <CheckCircle2 className="w-5 h-5 fill-current" />
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
