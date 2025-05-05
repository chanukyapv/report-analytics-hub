
from ariadne import MutationType, QueryType, ObjectType, make_executable_schema
from .auth import login_resolver, register_resolver, me_resolver, roles_resolver
from .metrics import (
    metrics_resolver, metric_resolver, create_metric_resolver,
    update_metric_resolver, delete_metric_resolver
)
from .reports import (
    weekly_reports_resolver, weekly_report_resolver,
    create_weekly_report_resolver, update_weekly_report_resolver,
    delete_weekly_report_resolver, quarterly_reports_resolver,
    export_report_resolver, service_metric_dashboard_resolver
)
from .fy_config import (
    fy_configs_resolver, fy_config_resolver, create_fy_config_resolver,
    update_fy_config_resolver, delete_fy_config_resolver
)
from .autosave import save_draft_resolver, get_draft_resolver

# Import IndusIT resolvers
from .indusit import (
    # Automation Metadata resolvers
    automation_metadata_resolver, 
    all_automation_metadata_resolver,
    automation_metadata_by_apaid_resolver,
    create_automation_metadata_resolver,
    update_automation_metadata_resolver,
    delete_automation_metadata_resolver,
    
    # Execution Data resolvers
    execution_data_resolver,
    all_execution_data_resolver,
    execution_data_by_apaid_resolver,
    create_execution_data_resolver,
    update_execution_data_resolver,
    delete_execution_data_resolver,
    
    # Dashboard Stats resolvers
    user_dashboard_stats_resolver,
    admin_dashboard_stats_resolver
)

# Type definitions
query = QueryType()
mutation = MutationType()
user = ObjectType("User")
metric = ObjectType("Metric")
weekly_report = ObjectType("WeeklyReport")
fy_config = ObjectType("FYConfig")
service_metric_dashboard = ObjectType("ServiceMetricDashboard")
report_summary = ObjectType("ReportSummary")
week_info = ObjectType("WeekInfo")
report_draft = ObjectType("ReportDraft")

# IndusIT Dashboard types
automation_metadata = ObjectType("AutomationMetadata")
execution_data = ObjectType("ExecutionData")
infra_register = ObjectType("InfraRegister")
interface_register = ObjectType("InterfaceRegister")
microbot_register = ObjectType("MicrobotRegister")
user_dashboard_stats = ObjectType("UserDashboardStats")
admin_dashboard_stats = ObjectType("AdminDashboardStats")
category_count = ObjectType("CategoryCount")
bot_status = ObjectType("BotStatus")

# Basic query
@query.field("hello")
def resolve_hello(_, info):
    return "Hello from Ariadne with FastAPI!"

# Auth resolvers
query.set_field("me", me_resolver)
query.set_field("roles", roles_resolver)
mutation.set_field("login", login_resolver)
mutation.set_field("register", register_resolver)

# Metrics resolvers
query.set_field("metrics", metrics_resolver)
query.set_field("metric", metric_resolver)
mutation.set_field("createMetric", create_metric_resolver)
mutation.set_field("updateMetric", update_metric_resolver)
mutation.set_field("deleteMetric", delete_metric_resolver)

# Reports resolvers
query.set_field("weeklyReports", weekly_reports_resolver)
query.set_field("weeklyReport", weekly_report_resolver)
query.set_field("quarterlyReports", quarterly_reports_resolver)
query.set_field("serviceMetricDashboard", service_metric_dashboard_resolver)
mutation.set_field("createWeeklyReport", create_weekly_report_resolver)
mutation.set_field("updateWeeklyReport", update_weekly_report_resolver)
mutation.set_field("deleteWeeklyReport", delete_weekly_report_resolver)
mutation.set_field("exportReport", export_report_resolver)

# FY Config resolvers
query.set_field("fyConfigs", fy_configs_resolver)
query.set_field("fyConfig", fy_config_resolver)
mutation.set_field("createFYConfig", create_fy_config_resolver)
mutation.set_field("updateFYConfig", update_fy_config_resolver)
mutation.set_field("deleteFYConfig", delete_fy_config_resolver)

# Autosave resolvers
query.set_field("getDraft", get_draft_resolver)
mutation.set_field("saveDraft", save_draft_resolver)

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

# Dashboard Stats
query.set_field("userDashboardStats", user_dashboard_stats_resolver)
query.set_field("adminDashboardStats", admin_dashboard_stats_resolver)

# Read schema file
with open("schema.graphql") as schema_file:
    type_defs = schema_file.read()

# Create executable schema
schema = make_executable_schema(
    type_defs, 
    query, 
    mutation, 
    user, 
    metric, 
    weekly_report, 
    fy_config,
    service_metric_dashboard,
    report_summary,
    week_info,
    report_draft,
    # IndusIT Dashboard types
    automation_metadata,
    execution_data,
    infra_register,
    interface_register,
    microbot_register,
    user_dashboard_stats,
    admin_dashboard_stats,
    category_count,
    bot_status
)
