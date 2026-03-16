"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { workflowSchema, stepSchema, ruleSchema } from "@/lib/schemas";
import { workflowApi, stepApi, ruleApi } from "@/lib/api";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useRouter, useParams } from "next/navigation";
import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { ArrowLeft, Save, Plus, Trash2, GitBranch, ListTree, Settings, Play, Loader2 } from "lucide-react";
import Link from "next/link";

export default function EditWorkflowWizard() {
  const router = useRouter();
  const { id } = useParams();
  const [currentStep, setCurrentStep] = useState(1); // 1: Info, 2: Steps, 3: Rules
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [steps, setSteps] = useState([]);
  const [rules, setRules] = useState([]);
  
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
        
        // Parse input schema
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
        
        // Match step names for display
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
          <div className="min-h-screen bg-gray-50 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
      );
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
            <Link href="/dashboard" className="inline-flex items-center text-sm text-gray-500 hover:text-blue-600 transition-colors gap-1">
                <ArrowLeft className="w-4 h-4" />
                Back to Dashboard
            </Link>
            <div className="flex items-center gap-4">
                {[1, 2, 3].map((s) => (
                    <div key={s} className="flex items-center cursor-pointer" onClick={() => setCurrentStep(s)}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                            currentStep === s ? 'bg-blue-600 text-white scale-110 shadow-lg' : 
                            'bg-white border-2 border-gray-200 text-gray-400'
                        }`}>
                            {s}
                        </div>
                        {s < 3 && <div className="w-12 h-0.5 bg-gray-200 mx-1" />}
                    </div>
                ))}
            </div>
        </div>

        {error && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-md mb-6 animate-in fade-in">
                <p className="text-sm text-red-700 font-medium">{error}</p>
            </div>
        )}

        {/* STEP 1: INFO */}
        {currentStep === 1 && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200">
                <div className="px-8 py-6 border-b border-gray-100">
                    <h1 className="text-xl font-bold flex items-center gap-2 text-gray-900">
                        <GitBranch className="w-5 h-5 text-blue-600" />
                        Update Workflow Info
                    </h1>
                </div>
                <form className="p-8 space-y-6" onSubmit={handleWorkflowSubmit(onWorkflowUpdate)}>
                    <Input
                        label="Workflow Name"
                        placeholder="e.g. Sales Pipeline"
                        {...regWorkflow("name")}
                        error={workflowErrors.name?.message}
                    />
                    
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <label className="text-sm font-semibold text-gray-700">Input Schema Fields</label>
                            <Button 
                                type="button" 
                                variant="outline" 
                                size="sm" 
                                onClick={() => append({ name: "", type: "string" })}
                                className="h-8 gap-1 hover:bg-gray-50"
                            >
                                <Plus className="w-4 h-4" /> Add Field
                            </Button>
                        </div>
                        <div className="space-y-3">
                            {fields.map((field, index) => (
                                <div key={field.id} className="flex gap-3 items-end animate-in fade-in slide-in-from-top-1">
                                    <div className="flex-1">
                                        <Input
                                            placeholder="Field Name"
                                            {...regWorkflow(`fields.${index}.name`)}
                                        />
                                    </div>
                                    <div className="w-40">
                                        <select
                                            className="w-full h-10 px-3 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
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
                                        className="p-2.5 text-gray-400 hover:text-red-500 transition-colors"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex justify-end pt-4">
                        <Button type="submit" disabled={saving} className="gap-2 px-6">
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            Save & Continue
                        </Button>
                    </div>
                </form>
            </div>
        )}

        {/* STEP 2: STEPS */}
        {currentStep === 2 && (
            <div className="space-y-6">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                        <h1 className="text-xl font-bold flex items-center gap-2 text-gray-900">
                            <ListTree className="w-5 h-5 text-blue-600" />
                            Workflow Steps
                        </h1>
                        <span className="text-xs font-bold bg-blue-100 text-blue-700 px-2 py-1 rounded-full">{steps.length} TOTAL</span>
                    </div>
                    
                    <form className="p-8 space-y-4 bg-white border-b border-gray-100 shadow-inner" onSubmit={handleStepSubmit(onAddStep)}>
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-2">Add New Step</h3>
                        <div className={`grid grid-cols-1 ${["approval", "notification"].includes(watchStep("step_type")) ? "md:grid-cols-4" : "md:grid-cols-3"} gap-4`}>
                            <Input label="Step Name" placeholder="e.g. Verification" {...regStep("name")} error={stepErrors.name?.message} />
                            <div className="space-y-1.5">
                                <label className="text-sm font-semibold text-gray-700">Type</label>
                                <select className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all" {...regStep("step_type")}>
                                    <option value="task">Task</option>
                                    <option value="approval">Approval</option>
                                    <option value="notification">Notification</option>
                                </select>
                            </div>
                            {["approval", "notification"].includes(watchStep("step_type")) && (
                                <Input 
                                    label={watchStep("step_type") === "approval" ? "Approver Email" : "Notifier Email"} 
                                    placeholder="email@example.com" 
                                    {...regStep("approver_email")} 
                                    error={stepErrors.approver_email?.message} 
                                />
                            )}
                            <div className="flex items-end">
                                <Button type="submit" disabled={saving} className="w-full gap-2">
                                    <Plus className="w-4 h-4" /> Add Step
                                </Button>
                            </div>
                        </div>
                    </form>

                    <div className="p-8 space-y-3 bg-white">
                        {steps.sort((a,b) => a.order - b.order).map((s, i) => (
                            <div key={s.id} className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl hover:border-blue-200 hover:shadow-sm transition-all group">
                                {editingStepId === s.id ? (
                                    <div className="flex flex-1 gap-4 items-end animate-in zoom-in-95 duration-200">
                                        <div className="flex-1">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Step Name</label>
                                            <Input 
                                                value={editStepDraft.name} 
                                                onChange={(e) => setEditStepDraft({ ...editStepDraft, name: e.target.value })} 
                                            />
                                        </div>
                                        <div className="w-40">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Type</label>
                                            <select 
                                                className="w-full h-10 px-3 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                                value={editStepDraft.step_type}
                                                onChange={(e) => setEditStepDraft({ ...editStepDraft, step_type: e.target.value })}
                                            >
                                                <option value="task">Task</option>
                                                <option value="approval">Approval</option>
                                                <option value="notification">Notification</option>
                                            </select>
                                        </div>
                                        {["approval", "notification"].includes(editStepDraft.step_type) && (
                                            <div className="flex-1 animate-in fade-in slide-in-from-top-1">
                                                <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">
                                                    {editStepDraft.step_type === "approval" ? "Approver Email" : "Notifier Email"}
                                                </label>
                                                <Input 
                                                    value={editStepDraft.approver_email || ""} 
                                                    onChange={(e) => setEditStepDraft({ ...editStepDraft, approver_email: e.target.value })} 
                                                />
                                            </div>
                                        )}
                                        <div className="flex gap-2">
                                            <Button size="sm" onClick={async () => {
                                                const updatedSteps = steps.map(step => step.id === s.id ? {...step, ...editStepDraft} : step);
                                                setSteps(updatedSteps);
                                                await stepApi.update(s.id, editStepDraft);
                                                setEditingStepId(null);
                                            }}>Save</Button>
                                            <Button size="sm" variant="ghost" onClick={() => setEditingStepId(null)}>Cancel</Button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div className="flex items-center gap-4 flex-1">
                                            <div className="bg-gray-100 text-gray-500 font-bold w-10 h-10 rounded-xl flex items-center justify-center text-sm">
                                                {i + 1}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <p className="font-bold text-gray-900">{s.name}</p>
                                                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100 italic">
                                                        {s.step_type}
                                                    </span>
                                                    {s.approver_email && (
                                                        <span className="text-[10px] text-blue-500 font-medium">({s.approver_email})</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                            <button 
                                                onClick={() => {
                                                    setEditingStepId(s.id);
                                                    setEditStepDraft({ name: s.name, step_type: s.step_type, order: s.order, metadata: s.metadata, approver_email: s.approver_email });
                                                }}
                                                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                            >
                                                <Settings className="w-4 h-4" />
                                            </button>
                                            <button 
                                                onClick={() => onDeleteStep(s.id)}
                                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
                <div className="flex justify-end">
                    <Button onClick={() => setCurrentStep(3)} className="gap-2 px-8">
                        Next: Configure Logic <ArrowLeft className="w-4 h-4 rotate-180" />
                    </Button>
                </div>
            </div>
        )}

        {/* STEP 3: RULES */}
        {currentStep === 3 && (
            <div className="space-y-6">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200">
                    <div className="px-8 py-6 border-b border-gray-100 bg-gray-50/50">
                        <h1 className="text-xl font-bold flex items-center gap-2 text-gray-900">
                            <Settings className="w-5 h-5 text-blue-600" />
                            Logic & Transition Rules
                        </h1>
                    </div>
                    
                    <form className="p-8 space-y-4 bg-white border-b border-gray-100 shadow-inner" onSubmit={handleRuleSubmit(onAddRule)}>
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-2">Add Transition Rule</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-sm font-semibold text-gray-700">From Step</label>
                                <select id="rule_step_id" className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all">
                                    {steps.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                            </div>
                            <Input label="Condition" placeholder="e.g. amount > 1000" {...regRule("condition")} error={ruleErrors.condition?.message} />
                            <div className="space-y-1.5">
                                <label className="text-sm font-semibold text-gray-700">To Next Step</label>
                                <select className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all" {...regRule("next_step_id")}>
                                    <option value="">End Workflow</option>
                                    {steps.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                            </div>
                            <div className="flex items-end">
                                <Button type="submit" disabled={saving} className="w-full gap-2">
                                    <Plus className="w-4 h-4" /> Add Rule
                                </Button>
                            </div>
                        </div>
                    </form>

                    <div className="p-8 space-y-3">
                        {rules.map((r, i) => (
                            <div key={r.id || i} className="flex items-center justify-between p-4 bg-blue-50/50 border border-blue-100 rounded-xl group hover:bg-blue-50 transition-all">
                                {editingRuleId === r.id ? (
                                    <div className="flex flex-1 gap-4 items-end animate-in zoom-in-95 duration-200">
                                        <div className="flex-1">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Condition</label>
                                            <Input 
                                                value={editRuleDraft.condition} 
                                                onChange={(e) => setEditRuleDraft({ ...editRuleDraft, condition: e.target.value })} 
                                            />
                                        </div>
                                        <div className="w-48">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Next Step</label>
                                            <select 
                                                className="w-full h-10 px-3 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                                value={editRuleDraft.next_step_id || ""}
                                                onChange={(e) => setEditRuleDraft({ ...editRuleDraft, next_step_id: e.target.value || null })}
                                            >
                                                <option value="">End Workflow</option>
                                                {steps.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                            </select>
                                        </div>
                                        <div className="w-20">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Priority</label>
                                            <Input 
                                                type="number"
                                                value={editRuleDraft.priority} 
                                                onChange={(e) => setEditRuleDraft({ ...editRuleDraft, priority: parseInt(e.target.value) })} 
                                            />
                                        </div>
                                        <div className="flex gap-2">
                                            <Button size="sm" onClick={async () => {
                                                const updatedRules = rules.map(rule => rule.id === r.id ? {...rule, ...editRuleDraft} : rule);
                                                setRules(updatedRules);
                                                await ruleApi.update(r.id, editRuleDraft);
                                                setEditingRuleId(null);
                                            }}>Save</Button>
                                            <Button size="sm" variant="ghost" onClick={() => setEditingRuleId(null)}>Cancel</Button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div className="flex items-center gap-3 flex-1">
                                            <div className="bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">P{r.priority}</div>
                                            <div className="text-sm text-gray-900 font-medium flex-1">
                                                IF <span className="text-blue-700 font-bold bg-blue-100 px-1.5 py-0.5 rounded">[{r.step_name}]</span> matches <code className="bg-white border border-blue-200 px-2 py-0.5 rounded text-indigo-700">"{r.condition}"</code> 
                                                <span className="mx-2 text-gray-400">→</span> 
                                                GO TO <span className="text-indigo-700 font-bold bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">[{steps.find(s => s.id === r.next_step_id)?.name || 'Complete Workflow'}]</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                            <button 
                                                onClick={() => {
                                                    setEditingRuleId(r.id);
                                                    setEditRuleDraft({ condition: r.condition, next_step_id: r.next_step_id, priority: r.priority });
                                                }}
                                                className="p-1.5 text-gray-400 hover:text-blue-600 transition-all"
                                            >
                                                <Settings className="w-4 h-4" />
                                            </button>
                                            <button 
                                                onClick={() => onDeleteRule(r.id)}
                                                className="p-1.5 text-gray-400 hover:text-red-500 transition-all"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        ))}
                        {rules.length === 0 && (
                            <div className="text-center py-10 text-gray-400 italic">No rules defined yet.</div>
                        )}
                    </div>
                    
                    <div className="p-8 border-t border-gray-100 bg-gray-50/50 flex justify-end">
                        <Button onClick={() => router.push('/dashboard')} className="gap-2 bg-blue-600 hover:bg-blue-700 px-8">
                            Finish Editing <Save className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            </div>
        )}
      </main>
    </div>
  );
}
