import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
});

// Add token to every request if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle authentication errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Only redirect if we're not already on the login page
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// GraphQL request helper
const graphqlRequest = async (query: string, variables = {}) => {
  try {
    const response = await api.post('/graphql', {
      query,
      variables,
    });

    if (response.data.errors) {
      throw new Error(response.data.errors[0].message);
    }

    return response.data.data;
  } catch (error: any) {
    if (error.response && error.response.data && error.response.data.errors) {
      throw new Error(error.response.data.errors[0].message);
    }
    throw error;
  }
};

// AUTH API
export const loginUser = async (credentials: { email: string; password: string }) => {
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
          last_login
          login_count
        }
      }
    }
  `;

  const variables = {
    input: credentials,
  };

  const data = await graphqlRequest(query, variables);
  return data.login;
};

export const registerUser = async (userData: { name: string; email: string; password: string }) => {
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

  const variables = {
    input: userData,
  };

  const data = await graphqlRequest(query, variables);
  return data.register;
};

export const fetchCurrentUser = async () => {
  const query = `
    query {
      me {
        id
        email
        name
        role
        is_active
        last_login
        login_count
      }
    }
  `;

  const data = await graphqlRequest(query);
  return data.me;
};

// ROLE REQUEST API
export const requestRole = async (roleRequest: { role: string; notes?: string }) => {
  const query = `
    mutation RequestRole($input: RoleRequestInput!) {
      requestRole(input: $input) {
        id
        requested_role
        status
        request_date
      }
    }
  `;

  const variables = {
    input: roleRequest,
  };

  const data = await graphqlRequest(query, variables);
  return data.requestRole;
};

export const fetchUserRoleRequests = async () => {
  const query = `
    query {
      userRoleRequests {
        id
        requested_role
        status
        request_date
        approval_date
        approved_by_name
        notes
      }
    }
  `;

  const data = await graphqlRequest(query);
  return data.userRoleRequests;
};

export const fetchUsers = async () => {
  const query = `
    query {
      users {
        id
        email
        name
        role
        is_active
        last_login
        login_count
      }
    }
  `;

  const data = await graphqlRequest(query);
  return data.users;
};

export const fetchSystemStats = async () => {
  const query = `
    query {
      systemStats {
        total_users
        active_users
        users_by_role {
          role
          count
        }
        pending_requests
      }
    }
  `;

  const data = await graphqlRequest(query);
  return data.systemStats;
};

export const fetchRoleRequests = async (status?: string) => {
  const query = `
    query RoleRequests($status: String) {
      roleRequests(status: $status) {
        id
        user_name
        user_email
        requested_role
        status
        request_date
        approval_date
        approved_by_name
        notes
      }
    }
  `;

  const variables = status ? { status } : {};
  const data = await graphqlRequest(query, variables);
  return data.roleRequests;
};

export const updateUserRole = async (params: { userId: string; role: string }) => {
  const query = `
    mutation UpdateUserRole($input: UpdateUserRoleInput!) {
      updateUserRole(input: $input) {
        id
        name
        email
        role
      }
    }
  `;

  const variables = {
    input: {
      user_id: params.userId,
      role: params.role
    }
  };

  const data = await graphqlRequest(query, variables);
  return data.updateUserRole;
};

export const approveRoleRequest = async (params: { requestId: string; status: string; notes?: string }) => {
  const query = `
    mutation ApproveRoleRequest($input: RoleRequestApprovalInput!) {
      approveRoleRequest(input: $input) {
        id
        status
        approval_date
      }
    }
  `;

  const variables = {
    input: {
      request_id: params.requestId,
      status: params.status,
      notes: params.notes || ""
    }
  };

  const data = await graphqlRequest(query, variables);
  return data.approveRoleRequest;
};

// Metrics API
export const fetchMetrics = async () => {
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

  const data = await graphqlRequest(query);
  return data.metrics;
};

export const fetchMetric = async (id: string) => {
  const query = `
    query Metric($id: ID!) {
      metric(id: $id) {
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

  const variables = {
    id,
  };

  const data = await graphqlRequest(query, variables);
  return data.metric;
};

export const createMetric = async (metricData: { name: string; baseline: number; target: number; actual_formula: string; unit: string }) => {
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

  const variables = {
    input: metricData,
  };

  const data = await graphqlRequest(query, variables);
  return data.createMetric;
};

export const updateMetric = async (id: string, metricData: { name: string; baseline: number; target: number; actual_formula: string; unit: string }) => {
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

  const variables = {
    id,
    input: metricData,
  };

  const data = await graphqlRequest(query, variables);
  return data.updateMetric;
};

export const deleteMetric = async (id: string) => {
  const query = `
    mutation DeleteMetric($id: ID!) {
      deleteMetric(id: $id)
    }
  `;

  const variables = {
    id,
  };

  const data = await graphqlRequest(query, variables);
  return data.deleteMetric;
};

// Reports API
export const fetchWeeklyReports = async (fy?: string, quarter?: string, week_date?: string) => {
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
          status
          quarter_actual
          actual_formula
        }
        created_by
        created_at
        updated_at
      }
    }
  `;

  const variables = {
    fy,
    quarter,
    week_date,
  };

  const data = await graphqlRequest(query, variables);
  return data.weeklyReports;
};

export const fetchWeeklyReport = async (id: string) => {
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
          status
          quarter_actual
          actual_formula
        }
        created_by
        created_at
        updated_at
      }
    }
  `;

  const variables = {
    id,
  };

  const data = await graphqlRequest(query, variables);
  return data.weeklyReport;
};

export const createWeeklyReport = async (reportData: { fy: string; quarter: string; week_date: string; metrics: any[] }) => {
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
          baseline
          target
          unit
          status
          quarter_actual
          actual_formula
        }
        created_by
        created_at
        updated_at
      }
    }
  `;

  const variables = {
    input: reportData,
  };

  const data = await graphqlRequest(query, variables);
  return data.createWeeklyReport;
};

export const updateWeeklyReport = async (id: string, reportData: { fy: string; quarter: string; week_date: string; metrics: any[] }) => {
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
          baseline
          target
          unit
          status
          quarter_actual
          actual_formula
        }
        created_by
        created_at
        updated_at
      }
    }
  `;

  const variables = {
    id,
    input: reportData,
  };

  const data = await graphqlRequest(query, variables);
  return data.updateWeeklyReport;
};

export const deleteWeeklyReport = async (id: string) => {
  const query = `
    mutation DeleteWeeklyReport($id: ID!) {
      deleteWeeklyReport(id: $id)
    }
  `;

  const variables = {
    id,
  };

  const data = await graphqlRequest(query, variables);
  return data.deleteWeeklyReport;
};

export const exportReport = async (exportData: { fy: string; quarter?: string; week_date?: string; format: string }) => {
  const query = `
    mutation ExportReport($input: ExportInput!) {
      exportReport(input: $input) {
        url
      }
    }
  `;

  const variables = {
    input: exportData,
  };

  const data = await graphqlRequest(query, variables);
  return data.exportReport;
};

// FY Config API
export const fetchFYConfigs = async () => {
  const query = `
    query FyConfigs {
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

  const data = await graphqlRequest(query);
  return data.fyConfigs;
};

export const fetchFYConfig = async (fy: string) => {
  const query = `
    query FyConfig($fy: String!) {
      fyConfig(fy: $fy) {
        id
        fy
        quarters {
          name
          weeks
        }
      }
    }
  `;

  const variables = {
    fy,
  };

  const data = await graphqlRequest(query, variables);
  return data.fyConfig;
};

export const createFYConfig = async (fyConfigData: { fy: string; quarters: any[] }) => {
  const query = `
    mutation CreateFYConfig($input: FYConfigInput!) {
      createFYConfig(input: $input) {
        id
        fy
        quarters {
          name
          weeks
        }
      }
    }
  `;

  const variables = {
    input: fyConfigData,
  };

  const data = await graphqlRequest(query, variables);
  return data.createFYConfig;
};

export const updateFYConfig = async (id: string, fyConfigData: { fy: string; quarters: any[] }) => {
  const query = `
    mutation UpdateFYConfig($id: ID!, $input: FYConfigInput!) {
      updateFYConfig(id: $id, input: $input) {
        id
        fy
        quarters {
          name
          weeks
        }
      }
    }
  `;

  const variables = {
    id,
    input: fyConfigData,
  };

  const data = await graphqlRequest(query, variables);
  return data.updateFYConfig;
};

export const deleteFYConfig = async (id: string) => {
  const query = `
    mutation DeleteFYConfig($id: ID!) {
      deleteFYConfig(id: $id)
    }
  `;

  const variables = {
    id,
  };

  const data = await graphqlRequest(query, variables);
  return data.deleteFYConfig;
};

// IndusIT Dashboard API
export const fetchAutomations = async () => {
  const query = `
    query Automations {
      automations {
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
        created_by
        created_at
        updated_at
      }
    }
  `;

  const data = await graphqlRequest(query);
  return data.automations;
};

export const fetchAutomation = async (id: string) => {
  const query = `
    query Automation($id: ID!) {
      automation(id: $id) {
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
        created_by
        created_at
        updated_at
      }
    }
  `;

  const variables = {
    id,
  };

  const data = await graphqlRequest(query, variables);
  return data.automation;
};

export const createAutomation = async (automationData: any) => {
  const query = `
    mutation CreateAutomation($input: AutomationInput!) {
      createAutomation(input: $input) {
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
        created_by
        created_at
        updated_at
      }
    }
  `;

  const variables = {
    input: automationData,
  };

  const data = await graphqlRequest(query, variables);
  return data.createAutomation;
};

export const updateAutomation = async (id: string, automationData: any) => {
  const query = `
    mutation UpdateAutomation($id: ID!, $input: AutomationInput!) {
      updateAutomation(id: $id, input: $input) {
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
        created_by
        created_at
        updated_at
      }
    }
  `;

  const variables = {
    id,
    input: automationData,
  };

  const data = await graphqlRequest(query, variables);
  return data.updateAutomation;
};

export const deleteAutomation = async (id: string) => {
  const query = `
    mutation DeleteAutomation($id: ID!) {
      deleteAutomation(id: $id)
    }
  `;

  const variables = {
    id,
  };

  const data = await graphqlRequest(query, variables);
  return data.deleteAutomation;
};
