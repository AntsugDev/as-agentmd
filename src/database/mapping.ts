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
    CHUNK_ID:number
    STATUS:string
    FILE_NAME:string
    PREVIEW_CONTENT_FILE:string
    LEN_TEXT_FILE:number
    ALL_FILE_DATA:string
    CHUNK_CONTENT:string
    PREVIEW_CONTENT_CHUNCK:string
    SUCCESS_CHUNK:string
    TAG:string
    CREATED_AT:string
    UPDATE_FILES:string
    UPDATE_CHUNK:string
    embedding:string
}