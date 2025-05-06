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
          roles
          is_active
        }
      }
    }
  `;
  
  const data = await fetchGraphQL(query, { input });
  return data.login;
}

export async function registerUser(input: { name: string; email: string; password: string; role: string; roles?: string[] }) {
  const query = `
    mutation Register($input: RegisterInput!) {
      register(input: $input) {
        token
        user {
          id
          email
          name
          role
          roles
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
        roles
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
          status
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

export async function updateMetric(token: string, id: string, input: { 
  name: string; 
  baseline: number;
  target: number;
  actual_formula: string;
  unit: string;
}) {
  const query = `
    mutation UpdateMetric($id: ID!, $input: MetricInput!) {
      updateMetric(id: $id, input: $input) {
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
  
  const data = await fetchGraphQL(query, { id, input }, token);
  return data.updateMetric;
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
          quarter_actual
          actual_formula
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
          quarter_actual
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
          quarter_actual
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

// IndusIT Dashboard API functions
// Automation Metadata
export async function getAutomationMetadata(token: string, id: string) {
  const query = `
    query AutomationMetadata($id: ID!) {
      automationMetadata(id: $id) {
        id
        apaid
        rpa_name
        priority
        description
        lifecycle_status
        frequency
        avg_volumes_expected
        sla
        interfaces
        screen_scraping
        design_documents_path
        code_repo_url
        code_repo_branch
        input_source
        input_source_details
        input_type
        camunda_flow_chart_url
        ace_url
        tech
        connecting_to_db
        db_table_names
        sme
        business_owner
        sme_sign_off_url
        dev_contacts
        design_contacts
        functional_asg_spocs
        house_keeping_activities
        addl_details
        business_impact
        category
        product_impacted
        journey_impacted
        cp_impacted
        support_queue_id
        open_stories
        created_at
        updated_at
      }
    }
  `;
  
  const data = await fetchGraphQL(query, { id }, token);
  return data.automationMetadata;
}

export async function getAllAutomationMetadata(token: string) {
  const query = `
    query {
      allAutomationMetadata {
        id
        apaid
        rpa_name
        priority
        lifecycle_status
        category
        created_at
        updated_at
      }
    }
  `;
  
  const data = await fetchGraphQL(query, {}, token);
  return data.allAutomationMetadata;
}

export async function getAutomationMetadataByApaid(token: string, apaid: string) {
  const query = `
    query AutomationMetadataByApaid($apaid: String!) {
      automationMetadataByApaid(apaid: $apaid) {
        id
        apaid
        rpa_name
        priority
        description
        lifecycle_status
        frequency
        avg_volumes_expected
        sla
        interfaces
        screen_scraping
        design_documents_path
        code_repo_url
        code_repo_branch
        input_source
        input_source_details
        input_type
        camunda_flow_chart_url
        ace_url
        tech
        connecting_to_db
        db_table_names
        sme
        business_owner
        sme_sign_off_url
        dev_contacts
        design_contacts
        functional_asg_spocs
        house_keeping_activities
        addl_details
        business_impact
        category
        product_impacted
        journey_impacted
        cp_impacted
        support_queue_id
        open_stories
        created_at
        updated_at
      }
    }
  `;
  
  const data = await fetchGraphQL(query, { apaid }, token);
  return data.automationMetadataByApaid;
}

export async function createAutomationMetadata(token: string, input: any) {
  const query = `
    mutation CreateAutomationMetadata($input: AutomationMetadataInput!) {
      createAutomationMetadata(input: $input) {
        id
        apaid
        rpa_name
      }
    }
  `;
  
  const data = await fetchGraphQL(query, { input }, token);
  return data.createAutomationMetadata;
}

export async function updateAutomationMetadata(token: string, id: string, input: any) {
  const query = `
    mutation UpdateAutomationMetadata($id: ID!, $input: AutomationMetadataInput!) {
      updateAutomationMetadata(id: $id, input: $input) {
        id
        apaid
        rpa_name
        updated_at
      }
    }
  `;
  
  const data = await fetchGraphQL(query, { id, input }, token);
  return data.updateAutomationMetadata;
}

export async function deleteAutomationMetadata(token: string, id: string) {
  const query = `
    mutation DeleteAutomationMetadata($id: ID!) {
      deleteAutomationMetadata(id: $id)
    }
  `;
  
  const data = await fetchGraphQL(query, { id }, token);
  return data.deleteAutomationMetadata;
}

// Execution Data
export async function getAllExecutionData(token: string) {
  const query = `
    query {
      allExecutionData {
        id
        apaid
        current_status
        last_successful_execution
        volumes_daily
        volumes_monthly
        created_at
        updated_at
      }
    }
  `;
  
  const data = await fetchGraphQL(query, {}, token);
  return data.allExecutionData;
}

export async function getExecutionDataByApaid(token: string, apaid: string) {
  const query = `
    query ExecutionDataByApaid($apaid: String!) {
      executionDataByApaid(apaid: $apaid) {
        id
        apaid
        current_status
        last_successful_execution
        volumes_daily
        volumes_monthly
        business_impact
        infra_details
        web_service_url
        app_url
        created_at
        updated_at
      }
    }
  `;
  
  const data = await fetchGraphQL(query, { apaid }, token);
  return data.executionDataByApaid;
}

// Dashboard Stats
export async function getUserDashboardStats(token: string) {
  const query = `
    query {
      userDashboardStats {
        automations_count_by_category {
          category
          count
        }
        volumes_processed_today
        p1_bots_status {
          apaid
          rpa_name
          status
        }
      }
    }
  `;
  
  const data = await fetchGraphQL(query, {}, token);
  return data.userDashboardStats;
}

export async function getAdminDashboardStats(token: string) {
  const query = `
    query {
      adminDashboardStats {
        automations_count_by_category {
          category
          count
        }
        volumes_processed_today
        p1_bots_status {
          apaid
          rpa_name
          status
        }
        last_dr_date
        current_vulns
      }
    }
  `;
  
  const data = await fetchGraphQL(query, {}, token);
  return data.adminDashboardStats;
}

// User management (superadmin only)
export async function updateUserRoles(token: string, userId: string, roles: string[]) {
  const query = `
    mutation UpdateUserRoles($userId: ID!, $roles: [String!]!) {
      updateUserRoles(user_id: $userId, roles: $roles) {
        id
        email
        name
        role
        roles
        is_active
      }
    }
  `;
  
  const data = await fetchGraphQL(query, { userId, roles }, token);
  return data.updateUserRoles;
}
