
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

// Automations
export async function getAutomations(token: string) {
  const query = `
    query {
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
  
  const data = await fetchGraphQL(query, {}, token);
  return data.automations;
}

export async function getAutomation(token: string, id: string) {
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
  
  const data = await fetchGraphQL(query, { id }, token);
  return data.automation;
}

export async function createAutomation(token: string, input: any) {
  const query = `
    mutation CreateAutomation($input: AutomationInput!) {
      createAutomation(input: $input) {
        id
        apaid
        rpa_name
      }
    }
  `;
  
  const data = await fetchGraphQL(query, { input }, token);
  return data.createAutomation;
}

export async function updateAutomation(token: string, id: string, input: any) {
  const query = `
    mutation UpdateAutomation($id: ID!, $input: AutomationInput!) {
      updateAutomation(id: $id, input: $input) {
        id
        apaid
        rpa_name
        updated_at
      }
    }
  `;
  
  const data = await fetchGraphQL(query, { id, input }, token);
  return data.updateAutomation;
}

export async function deleteAutomation(token: string, id: string) {
  const query = `
    mutation DeleteAutomation($id: ID!) {
      deleteAutomation(id: $id)
    }
  `;
  
  const data = await fetchGraphQL(query, { id }, token);
  return data.deleteAutomation;
}

// Execution Data
export async function getExecutionDatas(token: string) {
  const query = `
    query {
      executionDatas {
        id
        automation_id
        current_status
        last_successful_execution
        daily_volumes_processed
        monthly_volumes_processed
        business_impact
        infra_details
        web_service_url
        app_url
        created_at
        updated_at
      }
    }
  `;
  
  const data = await fetchGraphQL(query, {}, token);
  return data.executionDatas;
}

export async function getExecutionData(token: string, automationId: string) {
  const query = `
    query ExecutionData($automationId: ID!) {
      executionData(automationId: $automationId) {
        id
        automation_id
        current_status
        last_successful_execution
        daily_volumes_processed
        monthly_volumes_processed
        business_impact
        infra_details
        web_service_url
        app_url
        created_at
        updated_at
      }
    }
  `;
  
  const data = await fetchGraphQL(query, { automationId }, token);
  return data.executionData;
}

export async function createExecutionData(token: string, input: any) {
  const query = `
    mutation CreateExecutionData($input: ExecutionDataInput!) {
      createExecutionData(input: $input) {
        id
        automation_id
        current_status
      }
    }
  `;
  
  const data = await fetchGraphQL(query, { input }, token);
  return data.createExecutionData;
}

export async function updateExecutionData(token: string, id: string, input: any) {
  const query = `
    mutation UpdateExecutionData($id: ID!, $input: ExecutionDataInput!) {
      updateExecutionData(id: $id, input: $input) {
        id
        automation_id
        current_status
        updated_at
      }
    }
  `;
  
  const data = await fetchGraphQL(query, { id, input }, token);
  return data.updateExecutionData;
}

// Infra Servers
export async function getInfraServers(token: string) {
  const query = `
    query {
      infraServers {
        id
        ipname
        hostname
        env
        location
        zone
        usage
        os
        remarks
        created_at
        updated_at
      }
    }
  `;
  
  const data = await fetchGraphQL(query, {}, token);
  return data.infraServers;
}

export async function getInfraServer(token: string, id: string) {
  const query = `
    query InfraServer($id: ID!) {
      infraServer(id: $id) {
        id
        ipname
        hostname
        env
        location
        zone
        usage
        os
        remarks
        created_at
        updated_at
      }
    }
  `;
  
  const data = await fetchGraphQL(query, { id }, token);
  return data.infraServer;
}

export async function createInfraServer(token: string, input: any) {
  const query = `
    mutation CreateInfraServer($input: InfraServerInput!) {
      createInfraServer(input: $input) {
        id
        hostname
      }
    }
  `;
  
  const data = await fetchGraphQL(query, { input }, token);
  return data.createInfraServer;
}

export async function updateInfraServer(token: string, id: string, input: any) {
  const query = `
    mutation UpdateInfraServer($id: ID!, $input: InfraServerInput!) {
      updateInfraServer(id: $id, input: $input) {
        id
        hostname
        updated_at
      }
    }
  `;
  
  const data = await fetchGraphQL(query, { id, input }, token);
  return data.updateInfraServer;
}

// Interfaces
export async function getInterfaces(token: string, apaid?: string) {
  const query = `
    query Interfaces($apaid: String) {
      interfaces(apaid: $apaid) {
        id
        apaid
        rpa_name
        interfacing_application
        interfacing_application_appid
        svcid
        rams
        connectivity_type
        connectivity_direction
        data_consumed
        password_reset_frequency
        latest_password_change_date
        next_password_update_date
        credentials
        connection_string
        xfb_frequency
        filename
        api_url
        mq_details
        additional_details
        created_at
        updated_at
      }
    }
  `;
  
  const data = await fetchGraphQL(query, { apaid }, token);
  return data.interfaces;
}

export async function getInterface(token: string, id: string) {
  const query = `
    query Interface($id: ID!) {
      interface(id: $id) {
        id
        apaid
        rpa_name
        interfacing_application
        interfacing_application_appid
        svcid
        rams
        connectivity_type
        connectivity_direction
        data_consumed
        password_reset_frequency
        latest_password_change_date
        next_password_update_date
        credentials
        connection_string
        xfb_frequency
        filename
        api_url
        mq_details
        additional_details
        created_at
        updated_at
      }
    }
  `;
  
  const data = await fetchGraphQL(query, { id }, token);
  return data.interface;
}

export async function createInterface(token: string, input: any) {
  const query = `
    mutation CreateInterface($input: InterfaceInput!) {
      createInterface(input: $input) {
        id
        apaid
        rpa_name
      }
    }
  `;
  
  const data = await fetchGraphQL(query, { input }, token);
  return data.createInterface;
}

export async function updateInterface(token: string, id: string, input: any) {
  const query = `
    mutation UpdateInterface($id: ID!, $input: InterfaceInput!) {
      updateInterface(id: $id, input: $input) {
        id
        apaid
        rpa_name
        updated_at
      }
    }
  `;
  
  const data = await fetchGraphQL(query, { id, input }, token);
  return data.updateInterface;
}

// Microbots
export async function getMicrobots(token: string) {
  const query = `
    query {
      microbots {
        id
        bot_name
        bot_description
        technology
        input_parameters
        output_parameters
        apaid_list
        created_at
        updated_at
      }
    }
  `;
  
  const data = await fetchGraphQL(query, {}, token);
  return data.microbots;
}

export async function getMicrobot(token: string, id: string) {
  const query = `
    query Microbot($id: ID!) {
      microbot(id: $id) {
        id
        bot_name
        bot_description
        technology
        input_parameters
        output_parameters
        apaid_list
        created_at
        updated_at
      }
    }
  `;
  
  const data = await fetchGraphQL(query, { id }, token);
  return data.microbot;
}

export async function createMicrobot(token: string, input: any) {
  const query = `
    mutation CreateMicrobot($input: MicrobotInput!) {
      createMicrobot(input: $input) {
        id
        bot_name
      }
    }
  `;
  
  const data = await fetchGraphQL(query, { input }, token);
  return data.createMicrobot;
}

export async function updateMicrobot(token: string, id: string, input: any) {
  const query = `
    mutation UpdateMicrobot($id: ID!, $input: MicrobotInput!) {
      updateMicrobot(id: $id, input: $input) {
        id
        bot_name
        updated_at
      }
    }
  `;
  
  const data = await fetchGraphQL(query, { id, input }, token);
  return data.updateMicrobot;
}

// Dashboard Summaries
export async function getIndusITDashboardSummary(token: string) {
  const query = `
    query {
      indusITDashboardSummary {
        total_automations
        automations_by_category {
          category
          count
        }
        automations_by_status {
          status
          count
        }
        volumes_processed_today
        priority_p1_bots_status {
          apaid
          rpa_name
          current_status
        }
        total_servers
        total_interfaces
        total_microbots
      }
    }
  `;
  
  const data = await fetchGraphQL(query, {}, token);
  return data.indusITDashboardSummary;
}

export async function getAdminDashboardSummary(token: string) {
  const query = `
    query {
      adminDashboardSummary {
        last_dr_date
        current_vulnerabilities
        critical_vulnerabilities
        high_vulnerabilities
        medium_vulnerabilities
        low_vulnerabilities
      }
    }
  `;
  
  const data = await fetchGraphQL(query, {}, token);
  return data.adminDashboardSummary;
}
