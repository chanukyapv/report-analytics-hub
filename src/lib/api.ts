
// API utility functions to interact with GraphQL backend

const API_URL = "http://localhost:8000/graphql";

// Helper function for GraphQL requests
async function fetchGraphQL(query: string, variables = {}, token?: string) {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  
  const response = await fetch(API_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      query,
      variables,
    }),
  });
  
  const json = await response.json();
  
  if (json.errors) {
    throw new Error(json.errors[0].message);
  }
  
  return json.data;
}

// Auth functions
export async function loginUser(input: { email: string; password: string }) {
  const query = `
    mutation Login($input: LoginInput!) {
      login(input: $input) {
        token
        user {
          id
          email
          name
          role
          is_active
        }
      }
    }
  `;
  
  const data = await fetchGraphQL(query, { input });
  return data.login;
}

export async function registerUser(input: { name: string; email: string; password: string; role: string }) {
  const query = `
    mutation Register($input: RegisterInput!) {
      register(input: $input) {
        token
        user {
          id
          email
          name
          role
          is_active
        }
      }
    }
  `;
  
  const data = await fetchGraphQL(query, { input });
  return data.register;
}

export async function getCurrentUser(token: string) {
  const query = `
    query {
      me {
        id
        email
        name
        role
        is_active
      }
    }
  `;
  
  const data = await fetchGraphQL(query, {}, token);
  return data.me;
}

// Dashboard data
export async function getServiceMetricDashboard(token: string) {
  const query = `
    query {
      serviceMetricDashboard {
        weekInfo {
          date
          fy
          quarter
          weekNumber
        }
        report {
          metric_id
          name
          value
          comment
          baseline
          target
          unit
        }
        summary {
          total
          green
          amber
          red
        }
      }
    }
  `;
  
  const data = await fetchGraphQL(query, {}, token);
  return data.serviceMetricDashboard;
}

// Metrics functions
export async function getMetrics(token: string) {
  const query = `
    query {
      metrics {
        id
        name
        baseline
        target
        actual_formula
        unit
        created_by
      }
    }
  `;
  
  const data = await fetchGraphQL(query, {}, token);
  return data.metrics;
}

export async function createMetric(token: string, input: { 
  name: string; 
  baseline: number;
  target: number;
  actual_formula: string;
  unit: string;
}) {
  const query = `
    mutation CreateMetric($input: MetricInput!) {
      createMetric(input: $input) {
        id
        name
        baseline
        target
        actual_formula
        unit
        created_by
      }
    }
  `;
  
  const data = await fetchGraphQL(query, { input }, token);
  return data.createMetric;
}

// Report functions
export async function getWeeklyReports(token: string, fy?: string, quarter?: string, week_date?: string) {
  const query = `
    query WeeklyReports($fy: String, $quarter: String, $week_date: String) {
      weeklyReports(fy: $fy, quarter: $quarter, week_date: $week_date) {
        id
        fy
        quarter
        week_date
        metrics {
          metric_id
          name
          value
          comment
          baseline
          target
          unit
        }
        created_by
        created_at
        updated_at
      }
    }
  `;
  
  const data = await fetchGraphQL(query, { fy, quarter, week_date }, token);
  return data.weeklyReports;
}

export async function getWeeklyReport(token: string, id: string) {
  const query = `
    query WeeklyReport($id: ID!) {
      weeklyReport(id: $id) {
        id
        fy
        quarter
        week_date
        metrics {
          metric_id
          name
          value
          comment
          baseline
          target
          unit
        }
        created_by
        created_at
        updated_at
      }
    }
  `;
  
  const data = await fetchGraphQL(query, { id }, token);
  return data.weeklyReport;
}

export async function createWeeklyReport(token: string, input: {
  fy: string;
  quarter: string;
  week_date: string;
  metrics: Array<{
    metric_id: string;
    value: number;
    comment?: string;
  }>;
}) {
  const query = `
    mutation CreateWeeklyReport($input: WeeklyReportInput!) {
      createWeeklyReport(input: $input) {
        id
        fy
        quarter
        week_date
        metrics {
          metric_id
          name
          value
          comment
        }
        created_by
        created_at
      }
    }
  `;
  
  const data = await fetchGraphQL(query, { input }, token);
  return data.createWeeklyReport;
}

export async function updateWeeklyReport(token: string, id: string, input: {
  fy: string;
  quarter: string;
  week_date: string;
  metrics: Array<{
    metric_id: string;
    value: number;
    comment?: string;
  }>;
}) {
  const query = `
    mutation UpdateWeeklyReport($id: ID!, $input: WeeklyReportInput!) {
      updateWeeklyReport(id: $id, input: $input) {
        id
        fy
        quarter
        week_date
        metrics {
          metric_id
          name
          value
          comment
        }
        created_by
        updated_at
      }
    }
  `;
  
  const data = await fetchGraphQL(query, { id, input }, token);
  return data.updateWeeklyReport;
}

export async function getFYConfigs(token: string) {
  const query = `
    query {
      fyConfigs {
        id
        fy
        quarters {
          name
          weeks
        }
      }
    }
  `;
  
  const data = await fetchGraphQL(query, {}, token);
  return data.fyConfigs;
}

export async function exportReport(token: string, input: {
  fy: string;
  quarter?: string;
  week_date?: string;
  format: string;
}) {
  const query = `
    mutation ExportReport($input: ExportInput!) {
      exportReport(input: $input) {
        url
      }
    }
  `;
  
  const data = await fetchGraphQL(query, { input }, token);
  return data.exportReport;
}
