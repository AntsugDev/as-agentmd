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
    FILE_NAME:string
    PREVIEW_CONTENT_FILE:string
    TAG:string,
    CREATED_AT:string
    UPDATED_AT:string
    STATUS:string
}

export interface RagInt{
    CONTENT:string
    distance:number
}