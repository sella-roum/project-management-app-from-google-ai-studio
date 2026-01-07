export interface JqlClause {
  field: string;
  value: string;
}

export const parseJQL = (jql: string): JqlClause[] => {
  return jql
    .split(/ AND /i)
    .map((part) => {
      const match = part.match(/(\w+)\s*=\s*['"]?([^'"]+)['"]?/);
      if (!match) return null;
      const [, field, value] = match;
      return { field, value };
    })
    .filter(Boolean) as JqlClause[];
};
