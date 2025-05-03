
from ariadne import MutationType, QueryType, ObjectType, make_executable_schema

# Import resolvers
from app.resolvers.auth import login_resolver, register_resolver, me_resolver, roles_resolver

# Service dashboard resolvers
from app.resolvers.service.metrics import (
    metrics_resolver, metric_resolver, 
    create_metric_resolver, update_metric_resolver, delete_metric_resolver
)
from app.resolvers.service.reports import (
    weekly_reports_resolver, weekly_report_resolver,
    create_weekly_report_resolver, update_weekly_report_resolver,
    delete_weekly_report_resolver, quarterly_reports_resolver,
    export_report_resolver, service_metric_dashboard_resolver
)
from app.resolvers.service.fy_config import (
    fy_configs_resolver, fy_config_resolver, 
    create_fy_config_resolver, update_fy_config_resolver, delete_fy_config_resolver
)
from app.resolvers.service.autosave import save_draft_resolver, get_draft_resolver

# IndusIT dashboard resolvers
from app.resolvers.indusit.automations import (
    automations_resolver, automation_resolver,
    create_automation_resolver, update_automation_resolver, delete_automation_resolver
)
from app.resolvers.indusit.execution_data import (
    execution_datas_resolver, execution_data_resolver,
    create_execution_data_resolver, update_execution_data_resolver, delete_execution_data_resolver
)
from app.resolvers.indusit.infra_servers import (
    infra_servers_resolver, infra_server_resolver,
    create_infra_server_resolver, update_infra_server_resolver, delete_infra_server_resolver
)
from app.resolvers.indusit.interfaces import (
    interfaces_resolver, interface_resolver,
    create_interface_resolver, update_interface_resolver, delete_interface_resolver
)
from app.resolvers.indusit.microbots import (
    microbots_resolver, microbot_resolver,
    create_microbot_resolver, update_microbot_resolver, delete_microbot_resolver
)
from app.resolvers.indusit.dashboard import (
    indusit_dashboard_summary_resolver, admin_dashboard_summary_resolver
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

# IndusIT types
automation = ObjectType("Automation")
execution_data = ObjectType("ExecutionData")
infra_server = ObjectType("InfraServer")
interface = ObjectType("Interface")
microbot = ObjectType("Microbot")
indusit_dashboard_summary = ObjectType("IndusITDashboardSummary")
category_count = ObjectType("CategoryCount")
status_count = ObjectType("StatusCount")
bot_status = ObjectType("BotStatus")
admin_dashboard_summary = ObjectType("AdminDashboardSummary")

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
query.set_field("automations", automations_resolver)
query.set_field("automation", automation_resolver)
query.set_field("executionDatas", execution_datas_resolver)
query.set_field("executionData", execution_data_resolver)
query.set_field("infraServers", infra_servers_resolver)
query.set_field("infraServer", infra_server_resolver)
query.set_field("interfaces", interfaces_resolver)
query.set_field("interface", interface_resolver)
query.set_field("microbots", microbots_resolver)
query.set_field("microbot", microbot_resolver)
query.set_field("indusITDashboardSummary", indusit_dashboard_summary_resolver)
query.set_field("adminDashboardSummary", admin_dashboard_summary_resolver)

mutation.set_field("createAutomation", create_automation_resolver)
mutation.set_field("updateAutomation", update_automation_resolver)
mutation.set_field("deleteAutomation", delete_automation_resolver)
mutation.set_field("createExecutionData", create_execution_data_resolver)
mutation.set_field("updateExecutionData", update_execution_data_resolver)
mutation.set_field("deleteExecutionData", delete_execution_data_resolver)
mutation.set_field("createInfraServer", create_infra_server_resolver)
mutation.set_field("updateInfraServer", update_infra_server_resolver)
mutation.set_field("deleteInfraServer", delete_infra_server_resolver)
mutation.set_field("createInterface", create_interface_resolver)
mutation.set_field("updateInterface", update_interface_resolver)
mutation.set_field("deleteInterface", delete_interface_resolver)
mutation.set_field("createMicrobot", create_microbot_resolver)
mutation.set_field("updateMicrobot", update_microbot_resolver)
mutation.set_field("deleteMicrobot", delete_microbot_resolver)

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
    automation,
    execution_data,
    infra_server,
    interface,
    microbot,
    indusit_dashboard_summary,
    category_count,
    status_count,
    bot_status,
    admin_dashboard_summary
)
