import { HttpMethod } from "@activepieces/pieces-common"

export const getMethod = (method: any) => {
    if(method === 'POST'){
        return HttpMethod.POST
    } else if (method === 'GET'){
        return HttpMethod.GET
    } else if (method === 'PATCH') {
        return HttpMethod.PATCH
    } else if (method === 'PUT') {
        return HttpMethod.PUT
    } else if (method === 'DELETE') {
        return HttpMethod.DELETE
    } else if (method === 'HEAD') {
        return HttpMethod.HEAD
    }else{
        return ''
    }
}