
from ariadne import MutationType, QueryType, make_executable_schema

# Import resolvers
from resolvers.auth import login_resolver, register_resolver, me_resolver, roles_resolver

# Read schema file
with open("app/schema.graphql") as schema_file:
    type_defs = schema_file.read()

# Type definitions
query = QueryType()
mutation = MutationType()

# Basic query
@query.field("hello")
def resolve_hello(_, info):
    return "Hello from Ariadne with FastAPI!"

# Auth resolvers
query.set_field("me", me_resolver)
query.set_field("roles", roles_resolver)
mutation.set_field("login", login_resolver)
mutation.set_field("register", register_resolver)

# Create executable schema
schema = make_executable_schema(type_defs, query, mutation)
