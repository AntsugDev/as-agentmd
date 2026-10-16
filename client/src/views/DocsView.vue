<script setup lang="ts">
import {onBeforeMount, ref} from "vue";
import Accordion from 'primevue/accordion'
import AccordionContent from 'primevue/accordioncontent'
import AccordionHeader from 'primevue/accordionheader'
import AccordionPanel from 'primevue/accordionpanel'
import Tag from 'primevue/tag'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
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
    GET: 'info' as const,
    POST: 'success',
    PUT: 'warn',
    DELETE: 'danger',
  }

  return colors[method]
}

const formatValue = (value: any) => JSON.stringify(value, null, 2)

const routeDetails = (route: ApiRoute) => [
  {labelKey: 'pathParams', value: route.path_params},
  {labelKey: 'queryString', value: route.queryString},
  {labelKey: 'payload', value: route.payload},
  {labelKey: 'response', value: route.response},
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
      <Tag :value="t('docs.apiReference')" icon="mdi mdi-api" severity="info" class="docs-badge" />
      <h1>{{ t('docs.title') }}</h1>
      <p>{{ t('docs.intro') }}</p>
    </div>

    <div class="panel docs-summary">
      <div class="docs-base-url">
        <h2>{{ t('docs.baseEndpoint') }}</h2>
        <code>{{ pathBase }}</code>
      </div>

      <div class="docs-stats">
        <div class="summary-meta">
          <span>{{ t('docs.totalRoutes') }}</span>
          <strong>{{ routes.length }}</strong>
        </div>

        <div class="summary-meta">
          <span>{{ t('docs.middleware') }}</span>
          <strong>{{ middleware.length }}</strong>
        </div>
      </div>
    </div>

    <div class="panel">
      <div class="panel-title">
        <div class="docs-panel-heading">
          <i class="mdi mdi-shield-check-outline" aria-hidden="true"></i>
          <h2>{{ t('docs.middlewarePipeline') }}</h2>
        </div>
      </div>

      <ul class="middleware-list">
        <li v-for="item in middleware" :key="item.name" class="middleware-list__item">
          <span class="middleware-list__icon"><i class="mdi mdi-shield-lock-outline" aria-hidden="true"></i></span>
          <span class="middleware-list__details">
            <strong>{{ item.name }}</strong>
            <small>{{ item.description }}</small>
          </span>
        </li>
      </ul>
    </div>

    <div class="panel">
      <div class="panel-title">
        <div class="docs-panel-heading">
          <i class="mdi mdi-routes" aria-hidden="true"></i>
          <h2>{{ t('docs.endpoints') }}</h2>
        </div>
      </div>

      <Accordion class="docs-accordion">
        <AccordionPanel v-for="(route, index) in routes" :key="`${route.method}-${route.path}-${index}`" :value="index">
          <AccordionHeader>
            <div class="route-title">
              <Tag :value="route.method" :severity="methodColor(route.method)" class="route-method" />
              <div class="route-heading">
                <strong>/{{ route.path }}</strong>
                <small>{{ route.description }}</small>
              </div>
              <Tag
                :value="route.authorization ? t('docs.authRequired') : t('docs.public')"
                :severity="route.authorization ? 'warn' : 'success'"
                class="route-auth"
              />
            </div>
          </AccordionHeader>

          <AccordionContent>
            <div class="route-body">
              <div class="route-url">
                <span>{{ t('docs.fullRequestUrl') }}</span>
                <code>{{ routeUrl(route) }}</code>
              </div>

              <div v-for="detail in routeDetails(route)" :key="detail.labelKey" class="doc-block">
                <h3>{{ t(`docs.${detail.labelKey}`) }}</h3>
                <pre>{{ formatValue(detail.value) }}</pre>
              </div>
            </div>
          </AccordionContent>
        </AccordionPanel>
      </Accordion>
    </div>
  </section>
</template>

<style scoped>
.docs-badge {
  width: fit-content;
}

.docs-summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.docs-base-url {
  display: grid;
  gap: 8px;
}

.docs-base-url h2 {
  color: var(--color-text-muted);
  font-size: 0.95rem;
}

.docs-base-url code,
.route-url code {
  display: inline-block;
  width: fit-content;
  max-width: 100%;
  padding: 8px 12px;
  overflow-wrap: anywhere;
  border: 1px solid var(--color-border);
  border-radius: 9px;
  color: var(--color-primary);
  background: #f8fafc;
  font-family: var(--font-mono);
  font-size: 0.82rem;
  font-weight: 600;
}

.docs-stats {
  display: flex;
  align-items: center;
  gap: 24px;
}

.summary-meta {
  display: grid;
  gap: 3px;
  color: var(--color-text-muted);
  font-size: 0.8rem;
}

.summary-meta strong {
  color: var(--color-primary);
  font-size: 1.35rem;
}

.docs-panel-heading {
  display: flex;
  align-items: center;
  gap: 9px;
}

.docs-panel-heading > .mdi {
  color: var(--color-primary);
  font-size: 1.2rem;
}

.middleware-list {
  display: grid;
  gap: 6px;
  margin: 0;
  padding: 6px;
  border: 1px solid var(--color-border);
  border-radius: 12px;
  list-style: none;
}

.middleware-list__item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px;
}

.middleware-list__icon {
  display: grid;
  width: 34px;
  height: 34px;
  flex: 0 0 auto;
  place-items: center;
  border-radius: 50%;
  color: #059669;
  background: #d1fae5;
}

.middleware-list__details {
  display: grid;
  gap: 3px;
}

.middleware-list__details strong {
  font-size: 0.88rem;
}

.middleware-list__details small {
  color: var(--color-text-muted);
  font-size: 0.8rem;
}

.docs-accordion :deep(.p-accordionpanel) {
  margin-bottom: 10px;
  overflow: hidden;
  border: 1px solid var(--color-border);
  border-radius: 12px;
  background: #fff;
}

.docs-accordion :deep(.p-accordionheader) {
  padding: 14px;
}

.docs-accordion :deep(.p-accordioncontent-content) {
  padding: 0 14px 14px;
}

.route-title {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  width: 100%;
  gap: 12px;
  padding-right: 4px;
}

.route-method {
  min-width: 64px;
  justify-content: center;
  font-family: var(--font-mono);
  font-size: 0.72rem;
}

.route-auth {
  font-size: 0.68rem;
}

.route-heading {
  display: flex;
  flex-direction: column;
  min-width: 0;
  gap: 2px;
}

.route-heading strong {
  overflow-wrap: anywhere;
  font-family: var(--font-mono);
  font-size: 0.82rem;
}

.route-heading small {
  color: var(--color-text-muted);
  font-size: 0.76rem;
}

.route-body {
  display: grid;
  gap: 14px;
}

.route-url {
  display: grid;
  gap: 6px;
}

.route-url > span,
.doc-block h3 {
  color: #475569;
  font-size: 0.78rem;
  font-weight: 700;
}

.doc-block {
  display: grid;
  gap: 7px;
}

.doc-block pre {
  max-height: 420px;
  margin: 0;
  padding: 12px;
  overflow: auto;
  border: 1px solid #1e293b;
  border-radius: 10px;
  color: #f8fafc;
  background: #0f172a;
  font-family: var(--font-mono);
  font-size: 0.75rem;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

@media (max-width: 780px) {
  .docs-summary {
    align-items: flex-start;
    flex-direction: column;
  }

  .route-title {
    grid-template-columns: 1fr;
    align-items: flex-start;
  }
}
</style>
