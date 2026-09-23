<script setup lang="ts">
import {onBeforeMount, ref} from "vue";

const pathBase = "http://localhost:1010/api/"
type ApiRoute = {
  path: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  description: string,
  payload?: any | null,
  path_params?: any | null,
  queryString?: any | null,
  authorization: boolean,
  response: {
    status: number,
    message?: string | null,
    payload?: any | null
  }
}

const routes = ref<ApiRoute[]>([])
const middleware=ref<{
  name:string, description:string
}[]>([])

const routeUrl = (route: ApiRoute) => `${pathBase}${route.path}`

const methodColor = (method: ApiRoute['method']) => {
  const colors = {
    GET: 'info',
    POST: 'success',
    PUT: 'warning',
    DELETE: 'error',
  }

  return colors[method]
}

const formatValue = (value: any) => JSON.stringify(value, null, 2)

const routeDetails = (route: ApiRoute) => [
  {label: 'Path params', value: route.path_params},
  {label: 'Query string', value: route.queryString},
  {label: 'Payload', value: route.payload},
  {label: 'Response', value: route.response},
].filter((item) => item.value)

onBeforeMount(() => {

  middleware.value = [
    {
      name:'isConfig', description:"Verify that the configurations are present."
    },
    {
      name:'isUser', description:"Verify that the session is valid."
    }
  ]

  routes.value = [
    {
      path: "session",
      description: "Generate api-x-key for use another api",
      method: 'GET',
      authorization: false,
      response: {
        status: 200,
        payload: {
          type: 'Object',
          data: {
            apiKey: {type: "string", description: "x-api-key"}
          }
        }
      }
    },
    {
      path: "settings",
      description: "List config",
      method: 'GET',
      authorization: true,
      response: {
        status: 200,
        payload: {
          type: 'Object',
          data: {
            modelSelected: {type: "string", description: "Model selected for chat"},
            lastUpdated: {type: "string", description: "Datetime last updated list models"},
            providers: {type: "string", description: "List providers"},
          }
        }
      }
    },
    {
      path: "settings/model",
      description: "Model selected",
      method: 'GET',
      authorization: true,
      response: {
        status: 200,
        payload: {
          type: 'Object',
          data: {
            modelSelected: {type: "string", description: "Model selected for chat"},
          }
        }
      }
    },
    {
      path: "settings/{provider}",
      description: "Associated apiKey with provider",
      method: 'PUT',
      path_params: {
        provider: {
          type: "string",
          description: "Provider",
          note: "Generate exception,if is the provider passed into uri is not found"
        }
      },
      payload: {
        type: 'Object',
        data: {
          apikey: {type: "string", description: "ApiKey of the provider"}
        }
      },
      authorization: true,
      response: {
        status: 201
      }
    },
    {
      path: "settings/{provider}",
      description: "Delete associated apiKey with provider",
      method: 'DELETE',
      path_params: {
        provider: {
          type: "string",
          description: "Provider",
          note: "Generate exception,if is the provider passed into uri is not found"
        }
      },
      authorization: true,
      response: {
        status: 204
      }
    },
    {
      path: "sincro",
      description: "Update list models",
      method: 'GET',
      authorization: true,
      response: {
        status: 200,
        payload: {
          type: 'Object',
          data: {
            msg: {type: "string", description: "Message outcome"},
            pid: {type: "numeric", description: "number assigned to the task"}
          }
        }
      }
    },
    {
      path: "select_models/{model}",
      description: "Select model",
      method: 'GET',
      authorization: true,
      path_params: {
        model: {type: "string", description: "Model selected"}
      },
      response: {
        status: 204
      }
    },
    {
      path: "models",
      description: "List models",
      method: 'GET',
      authorization: true,
      response: {
        status: 200,
        payload: {
          type: "Array",
          data: {
            value: {type: "string", description: "Name (id)"},
            text: {type: "string | null", description: "Name"},
          }
        }
      }
    },
    {
      path: "chat/{status}",
      description: "Chat",
      method: 'POST',
      path_params: {
        status: {
          type: 'string',
          description: "Is status chat if first question or other question",
          value: "init|next",
          note: "If use next, of the other question into same chat"
        }
      },
      payload: {
        message: {type: 'string', description: "Question",},
        uuid: {type: "string | null", description: "Id of the chat", note: "Is status chat if first question is null"},
        time: {
          type: "string | null",
          description: "Is datetime request",
          note: "Is status chat if first question is null"
        },
        files: {
          type: "File|null", description: "Attachement file"
        }
      },
      queryString: {
        name_file: {
          type: "string|null",
          description: "An archive file is created for each chat; this field represents the file name."
        }
      },
      authorization: true,
      response: {
        status: 201,
        payload: {
          type: "Object",
          data: {
            uuid: {type: "string | null", description: "Id of the chat", note: "Is status chat if first question is null"},
            time: {
              type: "string | null",
              description: "Is datetime request",
              note: "Is status chat if first question is null"
            },
            global:{
              type:"Array", description:"Global messages in input(user) and output(agent)"
            },
            t:{
              type:"Object", description:"Input/Output Token chat", value:{
                input: "numeric|null", output:"numeric|null"
              }
            }
          }
        }
      }
    },
    {
      path:'archive/{uuid}',
      description:"Retrieve chat data",
      method:'GET',
      path_params:{
        uuid:{
          type:"string", description:"Name file archived chat"
        }
      },
      authorization:true,
      response:{
        status: 201
      }
    },
    {
      path:'archive',
      description:"List retrieve chat data",
      method:'GET',
      authorization:true,
      response:{
        status: 200,
        payload: {
          type:"Array",
          data:{
            uuid: {type:'string', description:"id of the chat"},
            name: {type:'string', description:"Name file chat archived"},
            title:{type:'string', description:"Substring first part text chat"},
            data_content: {type:'Array', description:"Global messages chat"},
            time: {type:'string', description:"Datetime chat"},
          }
        }
      }
    },
    {
      path:'download',
      description:"Download in csv list providers and models",
      method:'GET',
      authorization:true,
      response:{
        status: 200,
        payload: {
          type:"Blob"
        }
      }
    }


  ]

})

</script>

<template>
  <section class="content-grid">
    <div class="section-heading">
      <div class="d-flex align-center gap-2">
        <v-chip color="info" variant="tonal" size="small" class="font-weight-bold">
          <v-icon icon="mdi-api" size="14" class="mr-1"></v-icon>
          API Reference
        </v-chip>
      </div>
      <h1>Documents Api</h1>
      <p>Interactive API Endpoint documentation and middleware overview</p>
    </div>

    <!-- Docs Summary Card -->
    <v-sheet class="panel docs-summary" rounded="xl" border>
      <div>
        <h2 class="text-subtitle-2 text-grey-darken-1 mb-1 font-weight-bold">Base Endpoint URL</h2>
        <code class="font-mono px-3 py-1 bg-slate-100 rounded-lg text-primary font-weight-bold">{{ pathBase }}</code>
      </div>

      <div class="d-flex align-center gap-4">
        <div class="summary-meta">
          <span class="text-caption text-grey-darken-1">Total Routes</span>
          <strong class="text-h6 font-weight-bold text-primary">{{ routes.length }}</strong>
        </div>

        <div class="summary-meta">
          <span class="text-caption text-grey-darken-1">Middleware</span>
          <strong class="text-h6 font-weight-bold text-secondary">{{ middleware.length }}</strong>
        </div>
      </div>
    </v-sheet>

    <!-- Middleware Panel -->
    <v-sheet class="panel" rounded="xl" border>
      <div class="panel-title">
        <div class="d-flex align-center gap-2">
          <v-icon icon="mdi-shield-check-outline" color="primary"></v-icon>
          <h2>Middleware Guard Pipeline</h2>
        </div>
      </div>

      <v-list lines="two" density="comfortable" class="rounded-lg border pa-1">
        <v-list-item v-for="item in middleware" :key="item.name" class="rounded-lg mb-1">
          <template #prepend>
            <v-avatar color="success" variant="tonal" size="32">
              <v-icon icon="mdi-shield-lock-outline" size="18"></v-icon>
            </v-avatar>
          </template>
          <v-list-item-title class="font-weight-bold text-body-2">{{ item.name }}</v-list-item-title>
          <v-list-item-subtitle class="text-caption text-grey-darken-1">{{ item.description }}</v-list-item-subtitle>
        </v-list-item>
      </v-list>
    </v-sheet>

    <!-- Routes Panel -->
    <v-sheet class="panel" rounded="xl" border>
      <div class="panel-title">
        <div class="d-flex align-center gap-2">
          <v-icon icon="mdi-routes" color="primary"></v-icon>
          <h2>API Endpoints</h2>
        </div>
      </div>

      <v-expansion-panels variant="inset">
        <v-expansion-panel v-for="route in routes" :key="`${route.method}-${route.path}`" rounded="xl" border class="mb-3">
          <v-expansion-panel-title class="py-3">
            <div class="route-title">
              <v-chip
                  :color="methodColor(route.method)"
                  variant="flat"
                  label
                  size="small"
                  class="font-weight-bold text-uppercase"
              >
                {{ route.method }}
              </v-chip>
              <div class="route-heading">
                <strong class="font-mono text-body-2">/{{ route.path }}</strong>
                <small class="text-caption text-grey-darken-1">{{ route.description }}</small>
              </div>
              <v-chip
                  :color="route.authorization ? 'warning' : 'success'"
                  variant="tonal"
                  label
                  size="x-small"
                  class="font-weight-bold"
              >
                {{ route.authorization ? 'Auth Required' : 'Public' }}
              </v-chip>
            </div>
          </v-expansion-panel-title>

          <v-expansion-panel-text class="pt-2">
            <div class="route-body">
              <div class="route-url">
                <span class="text-caption font-weight-bold text-grey-darken-1">Full Request URL</span>
                <code class="font-mono text-caption pa-2 bg-slate-100 rounded-lg border">{{ routeUrl(route) }}</code>
              </div>

              <div
                  v-for="detail in routeDetails(route)"
                  :key="detail.label"
                  class="doc-block"
              >
                <h3 class="text-caption font-weight-bold text-grey-darken-2">{{ detail.label }}</h3>
                <pre class="font-mono text-caption pa-3 bg-slate-900 text-slate-100 rounded-lg overflow-x-auto">{{ formatValue(detail.value) }}</pre>
              </div>
            </div>
          </v-expansion-panel-text>
        </v-expansion-panel>
      </v-expansion-panels>
    </v-sheet>
  </section>
</template>

<style scoped>
.docs-summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.route-title {
  display: grid;
  grid-template-columns: 76px minmax(0, 1fr) auto;
  align-items: center;
  width: 100%;
  gap: 12px;
  padding-right: 8px;
}

.route-heading {
  display: flex;
  flex-direction: column;
  min-width: 0;
  gap: 2px;
}

.route-body {
  display: grid;
  gap: 14px;
}

.doc-block pre {
  background: #0f172a;
  color: #f8fafc;
  border-radius: 10px;
  border: 1px solid #1e293b;
}

@media (max-width: 780px) {
  .docs-summary,
  .route-title {
    grid-template-columns: 1fr;
    align-items: flex-start;
  }
}
</style>
