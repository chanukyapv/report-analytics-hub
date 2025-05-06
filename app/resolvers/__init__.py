
from ariadne import make_executable_schema, ObjectType
from app.resolvers.auth import (
    login_resolver, register_resolver, me_resolver, 
    roles_resolver, update_user_roles_resolver, all_users_resolver
)
from app.resolvers.metrics import (
    metrics_resolver, metric_resolver, create_metric_resolver,
    update_metric_resolver, delete_metric_resolver
)
from app.resolvers.reports import (
    weekly_reports_resolver, weekly_report_resolver, quarterly_reports_resolver,
    create_weekly_report_resolver, update_weekly_report_resolver, delete_weekly_report_resolver,
    get_draft_resolver, save_draft_resolver, export_report_resolver,
    service_metric_dashboard_resolver
)
from app.resolvers.fy_config import (
    fy_configs_resolver, fy_config_resolver, create_fy_config_resolver,
    update_fy_config_resolver, delete_fy_config_resolver
)
from app.resolvers.autosave import autosave_resolver
from app.resolvers.indusit import (
    # Automation Metadata
    automation_metadata_resolver, all_automation_metadata_resolver,
    automation_metadata_by_apaid_resolver, create_automation_metadata_resolver,
    update_automation_metadata_resolver, delete_automation_metadata_resolver,
    
    # Execution Data
    execution_data_resolver, all_execution_data_resolver,
    execution_data_by_apaid_resolver, create_execution_data_resolver,
    update_execution_data_resolver, delete_execution_data_resolver,
    
    # Infra Register
    infra_register_resolver, all_infra_register_resolver,
    create_infra_register_resolver, update_infra_register_resolver,
    delete_infra_register_resolver,
    
    # Interface Register
    interface_register_resolver, all_interface_register_resolver,
    interface_register_by_apaid_resolver, create_interface_register_resolver,
    update_interface_register_resolver, delete_interface_register_resolver,
    
    # Microbot Register
    microbot_register_resolver, all_microbot_register_resolver,
    microbot_register_by_apaid_resolver, create_microbot_register_resolver,
    update_microbot_register_resolver, delete_microbot_register_resolver,
    
    # Dashboard Stats
    user_dashboard_stats_resolver, admin_dashboard_stats_resolver
)

# Read schema from file
with open("schema.graphql") as schema_file:
    type_defs = schema_file.read()

# Define resolvers
query = ObjectType("Query")
mutation = ObjectType("Mutation")

# Auth resolvers
query.set_field("me", me_resolver)
query.set_field("roles", roles_resolver)
query.set_field("allUsers", all_users_resolver)
mutation.set_field("login", login_resolver)
mutation.set_field("register", register_resolver)
mutation.set_field("updateUserRoles", update_user_roles_resolver)

# Metrics resolvers
query.set_field("metrics", metrics_resolver)
query.set_field("metric", metric_resolver)
mutation.set_field("createMetric", create_metric_resolver)
mutation.set_field("updateMetric", update_metric_resolver)
mutation.set_field("deleteMetric", delete_metric_resolver)

# Report resolvers
query.set_field("weeklyReports", weekly_reports_resolver)
query.set_field("weeklyReport", weekly_report_resolver)
query.set_field("quarterlyReports", quarterly_reports_resolver)
query.set_field("getDraft", get_draft_resolver)
mutation.set_field("createWeeklyReport", create_weekly_report_resolver)
mutation.set_field("updateWeeklyReport", update_weekly_report_resolver)
mutation.set_field("deleteWeeklyReport", delete_weekly_report_resolver)
mutation.set_field("saveDraft", save_draft_resolver)
mutation.set_field("exportReport", export_report_resolver)

# Dashboard resolvers
query.set_field("serviceMetricDashboard", service_metric_dashboard_resolver)

# FY Config resolvers
query.set_field("fyConfigs", fy_configs_resolver)
query.set_field("fyConfig", fy_config_resolver)
mutation.set_field("createFYConfig", create_fy_config_resolver)
mutation.set_field("updateFYConfig", update_fy_config_resolver)
mutation.set_field("deleteFYConfig", delete_fy_config_resolver)

# IndusIT Dashboard resolvers
# Automation Metadata
query.set_field("automationMetadata", automation_metadata_resolver)
query.set_field("allAutomationMetadata", all_automation_metadata_resolver)
query.set_field("automationMetadataByApaid", automation_metadata_by_apaid_resolver)
mutation.set_field("createAutomationMetadata", create_automation_metadata_resolver)
mutation.set_field("updateAutomationMetadata", update_automation_metadata_resolver)
mutation.set_field("deleteAutomationMetadata", delete_automation_metadata_resolver)

# Execution Data
query.set_field("executionData", execution_data_resolver)
query.set_field("allExecutionData", all_execution_data_resolver)
query.set_field("executionDataByApaid", execution_data_by_apaid_resolver)
mutation.set_field("createExecutionData", create_execution_data_resolver)
mutation.set_field("updateExecutionData", update_execution_data_resolver)
mutation.set_field("deleteExecutionData", delete_execution_data_resolver)

# Infra Register
query.set_field("infraRegister", infra_register_resolver)
query.set_field("allInfraRegister", all_infra_register_resolver)
mutation.set_field("createInfraRegister", create_infra_register_resolver)
mutation.set_field("updateInfraRegister", update_infra_register_resolver)
mutation.set_field("deleteInfraRegister", delete_infra_register_resolver)

# Interface Register
query.set_field("interfaceRegister", interface_register_resolver)
query.set_field("allInterfaceRegister", all_interface_register_resolver)
query.set_field("interfaceRegisterByApaid", interface_register_by_apaid_resolver)
mutation.set_field("createInterfaceRegister", create_interface_register_resolver)
mutation.set_field("updateInterfaceRegister", update_interface_register_resolver)
mutation.set_field("deleteInterfaceRegister", delete_interface_register_resolver)

# Microbot Register
query.set_field("microbotRegister", microbot_register_resolver)
query.set_field("allMicrobotRegister", all_microbot_register_resolver)
query.set_field("microbotRegisterByApaid", microbot_register_by_apaid_resolver)
mutation.set_field("createMicrobotRegister", create_microbot_register_resolver)
mutation.set_field("updateMicrobotRegister", update_microbot_register_resolver)
mutation.set_field("deleteMicrobotRegister", delete_microbot_register_resolver)

# Dashboard Stats
query.set_field("userDashboardStats", user_dashboard_stats_resolver)
query.set_field("adminDashboardStats", admin_dashboard_stats_resolver)

# Create executable schema
schema = make_executable_schema(type_defs, query, mutation)
