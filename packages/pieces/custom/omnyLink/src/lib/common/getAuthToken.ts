import { HttpMethod } from "@activepieces/pieces-common";
import { httpRequest } from "./httpRequestSender";


export const getAuthToken = async(auth:any) => {
    console.log("auth", auth)
    const {username , password} = auth;
    if(!username || !password){
        return ''
    }else{
        const baseUrl = 'https://unifiedplatform.clicsoft.dev'
        const url = baseUrl + '/auth/authenticate';
        const headers = { Accept: 'application/json' }
        const httpResponse = await httpRequest({ method: HttpMethod.POST, url, body: auth, timeout: 5000, headers })
        if (httpResponse?.body?.token) {
            return httpResponse.body?.token
        } else {
            return ''
        }
    }
}