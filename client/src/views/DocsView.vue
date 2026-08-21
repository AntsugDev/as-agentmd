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
      <h1>Documents Api</h1>
      <p>List documents Api</p>
    </div>

    <v-sheet class="panel docs-summary" rounded="lg" border>
      <div>
        <h2>Path base</h2>
        <code>{{ pathBase }}</code>
      </div>

      <div class="summary-meta">
        <span>Routes</span>
        <strong>{{ routes.length }}</strong>
      </div>

      <div class="summary-meta">
        <span>Middleware</span>
        <strong>{{ middleware.length }}</strong>
      </div>
    </v-sheet>

    <v-sheet class="panel" rounded="lg" border>
      <div class="panel-title">
        <h2>Middleware</h2>
      </div>

      <v-list lines="two" density="comfortable">
        <v-list-item v-for="item in middleware" :key="item.name">
          <template #prepend>
            <v-icon icon="mdi-shield-check-outline"/>
          </template>
          <v-list-item-title>{{ item.name }}</v-list-item-title>
          <v-list-item-subtitle>{{ item.description }}</v-list-item-subtitle>
        </v-list-item>
      </v-list>
    </v-sheet>

    <v-sheet class="panel" rounded="lg" border>
      <div class="panel-title">
        <h2>Routes</h2>
      </div>

      <v-expansion-panels variant="accordion">
        <v-expansion-panel v-for="route in routes" :key="`${route.method}-${route.path}`">
          <v-expansion-panel-title>
            <div class="route-title">
              <v-chip
                  :color="methodColor(route.method)"
                  variant="flat"
                  label
                  size="small"
              >
                {{ route.method }}
              </v-chip>
              <div class="route-heading">
                <strong>/{{ route.path }}</strong>
                <small>{{ route.description }}</small>
              </div>
              <v-chip
                  :color="route.authorization ? 'warning' : 'success'"
                  variant="tonal"
                  label
                  size="small"
              >
                {{ route.authorization ? 'Auth' : 'Public' }}
              </v-chip>
            </div>
          </v-expansion-panel-title>

          <v-expansion-panel-text>
            <div class="route-body">
              <div class="route-url">
                <span>URL</span>
                <code>{{ routeUrl(route) }}</code>
              </div>

              <div
                  v-for="detail in routeDetails(route)"
                  :key="detail.label"
                  class="doc-block"
              >
                <h3>{{ detail.label }}</h3>
                <pre>{{ formatValue(detail.value) }}</pre>
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
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto auto;
  align-items: center;
  gap: 16px;
}

.docs-summary code,
.route-url code {
  display: inline-flex;
  max-width: 100%;
  padding: 6px 8px;
  border-radius: 6px;
  color: #1f2937;
  background: #f1f5f9;
  font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
  font-size: 0.9rem;
  overflow-x: auto;
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
  display: grid;
  min-width: 0;
  gap: 2px;
}

.route-heading strong {
  color: #111827;
  font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
  font-size: 0.95rem;
  overflow-wrap: anywhere;
}

.route-heading small,
.route-url span {
  color: #667085;
}

.route-body {
  display: grid;
  gap: 14px;
}

.route-url {
  display: grid;
  gap: 6px;
}

.doc-block {
  display: grid;
  gap: 8px;
}

.doc-block pre {
  margin: 0;
  padding: 12px 14px;
  border: 1px solid #dce5f1;
  border-radius: 8px;
  color: #253044;
  background: #f8fafc;
  font-size: 0.86rem;
  line-height: 1.45;
  overflow-x: auto;
}

@media (max-width: 780px) {
  .docs-summary,
  .route-title {
    grid-template-columns: 1fr;
    align-items: flex-start;
  }
}
</style>
