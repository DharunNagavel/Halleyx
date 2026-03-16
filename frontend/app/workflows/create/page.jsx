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
import { ArrowLeft, Save, Plus, Trash2, GitBranch, ListTree, Settings, Play } from "lucide-react";
import Link from "next/link";

export default function CreateWorkflowWizard() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1); // 1: Info, 2: Steps, 3: Rules
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [workflowId, setWorkflowId] = useState(null);
  const [steps, setSteps] = useState([]);
  const [rules, setRules] = useState([]);

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
      // Transform fields array to JSON schema object for backend
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
    <div className="min-h-screen bg-gray-50/50">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
            <Link href="/dashboard" className="inline-flex items-center text-sm text-gray-500 hover:text-blue-600 transition-colors gap-1">
                <ArrowLeft className="w-4 h-4" />
                Back
            </Link>
            <div className="flex items-center gap-4">
                {[1, 2, 3].map((s) => (
                    <div key={s} className="flex items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                            currentStep === s ? 'bg-blue-600 text-white' : 
                            currentStep > s ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'
                        }`}>
                            {s}
                        </div>
                        {s < 3 && <div className={`w-12 h-1 ${currentStep > s ? 'bg-green-500' : 'bg-gray-200'}`} />}
                    </div>
                ))}
            </div>
        </div>

        {error && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-md mb-6">
                <p className="text-sm text-red-700 font-medium">{error}</p>
            </div>
        )}

        {/* STEP 1: INITIAL WORKFLOW CREATION */}
        {currentStep === 1 && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200">
                <div className="px-8 py-6 border-b border-gray-100">
                    <h1 className="text-xl font-bold flex items-center gap-2">
                        <GitBranch className="w-5 h-5 text-blue-600" />
                        1. Define Workflow & Inputs
                    </h1>
                </div>
                <form className="p-8 space-y-6" onSubmit={handleWorkflowSubmit(onWorkflowSubmit)}>
                    <Input
                        label="Workflow Name"
                        placeholder="e.g. Sales Pipeline"
                        {...regWorkflow("name")}
                        error={workflowErrors.name?.message}
                    />
                    
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <label className="text-sm font-semibold text-gray-700">Input Fields (Schema)</label>
                            <Button 
                                type="button" 
                                variant="outline" 
                                size="sm" 
                                onClick={() => append({ name: "", type: "string" })}
                                className="h-8 gap-1"
                            >
                                <Plus className="w-4 h-4" /> Add Field
                            </Button>
                        </div>
                        <div className="space-y-3">
                            {fields.map((field, index) => (
                                <div key={field.id} className="flex gap-3 items-end animate-in fade-in slide-in-from-top-1">
                                    <div className="flex-1">
                                        <Input
                                            placeholder="Field Name (e.g. amount)"
                                            {...regWorkflow(`fields.${index}.name`)}
                                        />
                                    </div>
                                    <div className="w-40">
                                        <select
                                            className="w-full h-10 px-3 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
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
                        <Button type="submit" disabled={loading} className="gap-2">
                            Next: Add Steps <ArrowLeft className="w-4 h-4 rotate-180" />
                        </Button>
                    </div>
                </form>
            </div>
        )}

        {/* STEP 2: ADDING STEPS */}
        {currentStep === 2 && (
            <div className="space-y-6">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200">
                    <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center">
                        <h1 className="text-xl font-bold flex items-center gap-2">
                            <ListTree className="w-5 h-5 text-blue-600" />
                            2. Add Steps to Workflow
                        </h1>
                        <span className="text-sm font-medium text-gray-500">{steps.length} Steps added</span>
                    </div>
                    <form className="p-8 space-y-4 bg-gray-50/50 border-b border-gray-100" onSubmit={handleStepSubmit(onAddStep)}>
                        <div className={`grid grid-cols-1 ${["approval", "notification"].includes(watchStep("step_type")) ? "md:grid-cols-4" : "md:grid-cols-3"} gap-4`}>
                            <Input label="Step Name" placeholder="e.g. Check Inventory" {...regStep("name")} error={stepErrors.name?.message} />
                            <div className="space-y-1.5">
                                <label className="text-sm font-semibold text-gray-700">Type</label>
                                <select className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm" {...regStep("step_type")}>
                                    <option value="task">Task</option>
                                    <option value="approval">Approval</option>
                                    <option value="notification">Notification</option>
                                </select>
                            </div>
                            {/* EMAIL FIELD - Show if type is approval or notification */}
                            {["approval", "notification"].includes(watchStep("step_type")) && (
                                <div className="space-y-1.5 animate-in fade-in slide-in-from-top-1">
                                    <label className="text-sm font-semibold text-gray-700">
                                        {watchStep("step_type") === "approval" ? "Approver Email" : "Notifier Email"}
                                    </label>
                                    <Input 
                                        placeholder="email@example.com" 
                                        {...regStep("approver_email")} 
                                        error={stepErrors.approver_email?.message} 
                                    />
                                </div>
                            )}
                            <div className="flex items-end">
                                <Button type="submit" disabled={loading} className="w-full gap-2">
                                    <Plus className="w-4 h-4" /> Add Step
                                </Button>
                            </div>
                        </div>
                    </form>
                    <div className="p-8 space-y-3">
                        {steps.length === 0 ? (
                            <div className="text-center py-8 text-gray-400 border-2 border-dashed rounded-xl">No steps added yet. Add your first step above.</div>
                        ) : (
                            steps.map((s, i) => (
                                <div key={s.id} className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl shadow-sm group">
                                    <div className="flex items-center gap-4">
                                        <div className="bg-blue-50 text-blue-600 font-bold w-8 h-8 rounded-lg flex items-center justify-center">{i + 1}</div>
                                        <div>
                                            <p className="font-semibold text-gray-900">{s.name}</p>
                                            <p className="text-xs text-gray-500 uppercase tracking-wider">{s.step_type}</p>
                                        </div>
                                    </div>
                                    <button onClick={() => setSteps(steps.filter(x => x.id !== s.id))} className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                    <div className="p-8 border-t border-gray-100 flex justify-end">
                        <Button onClick={() => setCurrentStep(3)} disabled={steps.length < 1} className="gap-2" variant="primary">
                            Next: Define Rules <ArrowLeft className="w-4 h-4 rotate-180" />
                        </Button>
                    </div>
                </div>
            </div>
        )}

        {/* STEP 3: DEFINING RULES */}
        {currentStep === 3 && (
            <div className="space-y-6">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200">
                    <div className="px-8 py-6 border-b border-gray-100">
                        <h1 className="text-xl font-bold flex items-center gap-2">
                            <Settings className="w-5 h-5 text-blue-600" />
                            3. Define Logic & Rules
                        </h1>
                    </div>
                    <form className="p-8 space-y-4 bg-gray-50/50 border-b border-gray-100" onSubmit={handleRuleSubmit(onAddRule)}>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-sm font-semibold text-gray-700">From Step</label>
                                <select id="rule_step_id" className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm bg-white">
                                    {steps.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                            </div>
                            <Input label="Condition" placeholder="e.g. amount > 1000 or DEFAULT" {...regRule("condition")} error={ruleErrors.condition?.message} />
                            <div className="space-y-1.5">
                                <label className="text-sm font-semibold text-gray-700">Go to Step</label>
                                <select className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm bg-white" {...regRule("next_step_id")}>
                                    <option value="">End Workflow</option>
                                    {steps.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                            </div>
                            <Input label="Priority" type="number" {...regRule("priority")} error={ruleErrors.priority?.message} />
                            <div className="flex items-end">
                                <Button type="submit" disabled={loading} className="w-full gap-2">
                                    <Plus className="w-4 h-4" /> Add Rule
                                </Button>
                            </div>
                        </div>
                    </form>
                    <div className="p-8 space-y-3">
                        {rules.length === 0 ? (
                            <div className="text-center py-8 text-gray-400 border-2 border-dashed rounded-xl">No rules defined. Rules control the flow between steps.</div>
                        ) : (
                            rules.map((r, i) => (
                                <div key={i} className="flex items-center justify-between p-4 bg-blue-50/50 border border-blue-100 rounded-xl group">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">P{r.priority}</div>
                                        <div className="font-medium text-gray-900">
                                            IF <span className="text-blue-600">[{r.step_name}]</span> meets <span className="font-bold">"{r.condition}"</span> 
                                            <span className="mx-2">→</span> 
                                            GO TO <span className="text-indigo-600">[{steps.find(s => s.id === r.next_step_id)?.name || 'End'}]</span>
                                        </div>
                                    </div>
                                    <button onClick={() => setRules(rules.filter((_, idx) => idx !== i))} className="text-gray-300 hover:text-red-500 transition-colors">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                     <div className="p-8 border-t border-gray-100 flex justify-end">
                        <Button onClick={() => router.push('/dashboard')} className="gap-2" variant="primary">
                            Complete Workflow <Play className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            </div>
        )}
      </main>
    </div>
  );
}
