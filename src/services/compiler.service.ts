export interface CompilerExecuteRequest {
  language: string;
  version?: string;
  files: Array<{ content: string; name?: string }>;
  stdin?: string;
}

export class CompilerService {
  executeCode = async (params: CompilerExecuteRequest): Promise<any> => {
    const pistonUrl = process.env.PISTON_URL || 'https://emkc.org/api/v2/piston/execute';
    const apiKey = process.env.PISTON_API_KEY;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

    const response = await fetch(pistonUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        language: params.language,
        version: '*',
        files: params.files,
        stdin: params.stdin || '',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Compiler API error (${response.status}): ${errorText || response.statusText}`);
    }

    return response.json();
  };
}

export const compilerService = new CompilerService();
