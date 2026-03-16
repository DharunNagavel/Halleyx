import { z } from "zod";

export const signupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const signinSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const workflowSchema = z.object({
  name: z.string().min(2, "Workflow name must be at least 2 characters"),
  fields: z.array(z.object({
    name: z.string().min(1, "Field name is required"),
    type: z.enum(["string", "number", "boolean"]),
  })).min(1, "At least one input field is required"),
});

export const stepSchema = z.object({
  name: z.string().min(2, "Step name must be at least 2 characters"),
  step_type: z.enum(["task", "approval", "notification"]),
  order: z.number().int().min(1),
  approver_email: z.string().email("Invalid approver email").optional().or(z.literal("")),
  metadata: z.record(z.any()).optional(),
});

export const ruleSchema = z.object({
  condition: z.string().min(1, "Condition is required (or 'DEFAULT')"),
  next_step_id: z.string().optional().or(z.literal("")).transform(val => val === "" ? null : val),
  priority: z.preprocess((val) => Number(val), z.number().int().min(1)),
});

