export interface Chunks{
    ID:number
    FILE_ID:number
    CONTENT:string
    TOKENS?:number|null
    STATUS?:number|null
    RETRY_COUNT?:number|null
    CREATED_AT?:string
    UPDATED_AT?:string
}

export interface Files{
    ID:number
    FILE_NAME:string
    CONTENT:string
    TAG:string
    STATUS_ID:number
    MODEL_USED?:string|null
    CREATED_AT?:string
    UPDATED_AT?:string|null
    RETRY_COUNT?:number|null
    MIME_TYPE:string
    EXT:string
}
export interface Status{
    ID:number
    NAME:string
}
export interface Embed{
    chunk_id:number
    file_id:number
    embedding:string
}

export interface ListData{
    FILE_ID:number
    STATUS_NAME:string
    TOT_CHUNKS:number|null
    NOT_ELABORATE:number|null
    EXCEPTION:number|null
    ELABORATE:number|null
    TOT_EMB:number|null
    FILE_NAME:string
    TAG:string
    CREATED_AT:string
    UPDATED_AT:string
}

export interface RagInt{
    CONTENT:string
    distance:number
}