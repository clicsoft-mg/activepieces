import { httpClient, HttpMethod, HttpRequest, HttpResponse } from "@activepieces/pieces-common";

type HttpRequestParams = {
    method: HttpMethod; // HTTP Method (GET, POST, PUT, DELETE, etc.)
    url: string;        // The API endpoint URL
    body?: any;         // Optional payload for methods like POST, PUT
    timeout?: number;   // Optional timeout in milliseconds
    headers?: Record<string, string>; // Optional headers
    queryParams?: Record<string, string | number | boolean | undefined>; // Query parameters
};

// Define the function for making HTTP requests
export const httpRequest = async (req: HttpRequestParams): Promise<HttpResponse> => {
    const { method, url, body, timeout = 0, headers, queryParams } = req;
    const buildUrlWithQueryParams = (url: string, queryParams?: Record<string, string | number | boolean | undefined>): string => {
        if (!queryParams) return url;
        const searchParams = new URLSearchParams();
        for (const [key, value] of Object.entries(queryParams)) {
            if (value !== undefined && value !== null) {
                searchParams.append(key, String(value));
            }
        }
        const queryString = searchParams.toString();
        return queryString ? `${url}?${queryString}` : url;
    };

    const finalUrl = buildUrlWithQueryParams(url, queryParams);

    // Create the base request object
    const loginRequest: HttpRequest = {
        method: method,
        url: finalUrl,
        headers: headers,
        timeout: timeout,
    };

    // Add body only for methods that require it (e.g., POST, PUT)
    if (method !== HttpMethod.GET && method !== HttpMethod.DELETE && body) {
        loginRequest.body = body;
    }

    try {
        // Send the HTTP request using the httpClient
        const httpReq = await httpClient.sendRequest(loginRequest);

        // Log the response for debugging
        console.debug("Response received:", httpReq);

        // Return the response
        return httpReq;
    } catch (error) {
        // Handle any errors in the request
        console.error("Error during HTTP request:", error);

        // Re-throw the error for higher-level handling
        throw new Error(`HTTP request failed: ${error}`);
    }
};
