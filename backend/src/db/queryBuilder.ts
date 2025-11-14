/**
 * Query builder helpers for common database patterns
 */

export interface WhereCondition {
  field: string;
  operator:
    | "="
    | "!="
    | ">"
    | "<"
    | ">="
    | "<="
    | "LIKE"
    | "ILIKE"
    | "IN"
    | "IS NULL"
    | "IS NOT NULL";
  value?: any;
}

export interface OrderBy {
  field: string;
  direction: "ASC" | "DESC";
}

export interface PaginationOptions {
  limit?: number;
  offset?: number;
}

/**
 * Build WHERE clause from conditions
 */
export function buildWhereClause(conditions: WhereCondition[]): {
  clause: string;
  params: any[];
} {
  if (conditions.length === 0) {
    return { clause: "", params: [] };
  }

  const params: any[] = [];
  const clauses: string[] = [];

  conditions.forEach((condition) => {
    if (
      condition.operator === "IS NULL" ||
      condition.operator === "IS NOT NULL"
    ) {
      clauses.push(`${condition.field} ${condition.operator}`);
    } else if (condition.operator === "IN") {
      if (Array.isArray(condition.value) && condition.value.length > 0) {
        const placeholders = condition.value
          .map((_, i) => `$${params.length + i + 1}`)
          .join(", ");
        clauses.push(`${condition.field} IN (${placeholders})`);
        params.push(...condition.value);
      }
    } else {
      params.push(condition.value);
      clauses.push(
        `${condition.field} ${condition.operator} $${params.length}`
      );
    }
  });

  return {
    clause: `WHERE ${clauses.join(" AND ")}`,
    params,
  };
}

/**
 * Build ORDER BY clause
 */
export function buildOrderByClause(orderBy: OrderBy[]): string {
  if (orderBy.length === 0) {
    return "";
  }

  const clauses = orderBy.map((order) => `${order.field} ${order.direction}`);
  return `ORDER BY ${clauses.join(", ")}`;
}

/**
 * Build LIMIT and OFFSET clause
 */
export function buildPaginationClause(
  options: PaginationOptions,
  paramOffset: number = 0
): { clause: string; params: any[] } {
  const params: any[] = [];
  const clauses: string[] = [];

  if (options.limit !== undefined) {
    params.push(options.limit);
    clauses.push(`LIMIT $${paramOffset + params.length}`);
  }

  if (options.offset !== undefined) {
    params.push(options.offset);
    clauses.push(`OFFSET $${paramOffset + params.length}`);
  }

  return {
    clause: clauses.join(" "),
    params,
  };
}

/**
 * Build INSERT query
 */
export function buildInsertQuery(
  table: string,
  data: Record<string, any>,
  returning: string = "*"
): { query: string; params: any[] } {
  const fields = Object.keys(data);
  const params = Object.values(data);
  const placeholders = fields.map((_, i) => `$${i + 1}`).join(", ");

  const query = `
    INSERT INTO ${table} (${fields.join(", ")})
    VALUES (${placeholders})
    RETURNING ${returning}
  `;

  return { query, params };
}

/**
 * Build UPDATE query
 */
export function buildUpdateQuery(
  table: string,
  data: Record<string, any>,
  conditions: WhereCondition[],
  returning: string = "*"
): { query: string; params: any[] } {
  const fields = Object.keys(data);
  const params = Object.values(data);

  const setClauses = fields
    .map((field, i) => `${field} = $${i + 1}`)
    .join(", ");

  const { clause: whereClause, params: whereParams } =
    buildWhereClause(conditions);

  // Adjust parameter numbers in WHERE clause
  const adjustedWhereClause = whereClause.replace(
    /\$(\d+)/g,
    (_, num) => `$${parseInt(num) + params.length}`
  );

  const query = `
    UPDATE ${table}
    SET ${setClauses}
    ${adjustedWhereClause}
    RETURNING ${returning}
  `;

  return { query, params: [...params, ...whereParams] };
}

/**
 * Build DELETE query
 */
export function buildDeleteQuery(
  table: string,
  conditions: WhereCondition[]
): { query: string; params: any[] } {
  const { clause: whereClause, params } = buildWhereClause(conditions);

  const query = `
    DELETE FROM ${table}
    ${whereClause}
  `;

  return { query, params };
}

/**
 * Build SELECT query
 */
export function buildSelectQuery(
  table: string,
  fields: string[] = ["*"],
  conditions: WhereCondition[] = [],
  orderBy: OrderBy[] = [],
  pagination?: PaginationOptions
): { query: string; params: any[] } {
  const { clause: whereClause, params: whereParams } =
    buildWhereClause(conditions);
  const orderByClause = buildOrderByClause(orderBy);
  const { clause: paginationClause, params: paginationParams } =
    buildPaginationClause(pagination || {}, whereParams.length);

  const query = `
    SELECT ${fields.join(", ")}
    FROM ${table}
    ${whereClause}
    ${orderByClause}
    ${paginationClause}
  `.trim();

  return { query, params: [...whereParams, ...paginationParams] };
}

/**
 * Escape identifier for safe SQL usage
 */
export function escapeIdentifier(identifier: string): string {
  return `"${identifier.replace(/"/g, '""')}"`;
}

/**
 * Convert camelCase to snake_case for database fields
 */
export function toSnakeCase(str: string): string {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

/**
 * Convert snake_case to camelCase for JavaScript objects
 */
export function toCamelCase(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

/**
 * Convert object keys from snake_case to camelCase
 */
export function rowToCamelCase<T = any>(row: Record<string, any>): T {
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(row)) {
    result[toCamelCase(key)] = value;
  }
  return result as T;
}

/**
 * Convert object keys from camelCase to snake_case
 */
export function objectToSnakeCase(
  obj: Record<string, any>
): Record<string, any> {
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    result[toSnakeCase(key)] = value;
  }
  return result;
}
