export const evaluateRules = (rules, data) => 
{
  let defaultRule = null;
  for (let rule of rules) {
    if (rule.condition === "DEFAULT") {
      defaultRule = rule;
      continue;
    }
    try {
      const result = evaluateCondition(rule.condition, data);
      if (result === true) {
        return rule.next_step_id;
      }
    } catch (error) {
      console.error("Rule evaluation error:", error);
    }
  }
  if (defaultRule) {
    return defaultRule.next_step_id;
  }
  return null;
};

const evaluateCondition = (condition, data) => 
{
  let expression = condition;
  expression = expression.replace(
    /contains\((\w+),\s*['"](.*?)['"]\)/g,
    (_, field, value) => {
      return `(data["${field}"] && data["${field}"].includes("${value}"))`;
    },
  );
  expression = expression.replace(
    /startsWith\((\w+),\s*['"](.*?)['"]\)/g,
    (_, field, value) => {
      return `(data["${field}"] && data["${field}"].startsWith("${value}"))`;
    },
  );
  expression = expression.replace(
    /endsWith\((\w+),\s*['"](.*?)['"]\)/g,
    (_, field, value) => {
      return `(data["${field}"] && data["${field}"].endsWith("${value}"))`;
    },
  );
  Object.keys(data).forEach((key) => {
    const regex = new RegExp(`\\b${key}\\b`, "g");
    expression = expression.replace(regex, `data["${key}"]`);
  });
  try {
    return eval(expression);
  } catch (error) {
    throw new Error(`Invalid rule condition: ${condition}`);
  }
};