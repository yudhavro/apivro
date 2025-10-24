/**
 * WAHA (WhatsApp HTTP API) Service
 * Handles communication with WAHA server for WhatsApp operations
 */

const WAHA_BASE_URL = import.meta.env.VITE_WAHA_URL || 'http://localhost:3000';
const WAHA_API_KEY = import.meta.env.VITE_WAHA_API_KEY || '';

export interface WAHASession {
  name: string;
  status: 'STOPPED' | 'STARTING' | 'SCAN_QR_CODE' | 'WORKING' | 'FAILED';
  me?: string;
  config?: {
    webhooks?: Array<{
      url: string;
      events: string[];
    }>;
  };
}

export interface WAHAQRCode {
  value: string;
  base64?: string;
}

export interface WAHAScreenshot {
  mimetype: string;
  data: string;
}

export interface WAHAMessageResponse {
  id: string;
  timestamp: number;
  body?: string;
}

/**
 * WAHA API Client
 */
class WAHAClient {
  private baseUrl: string;

  constructor(baseUrl: string = WAHA_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Get headers with API key
   */
  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    if (WAHA_API_KEY) {
      headers['X-Api-Key'] = WAHA_API_KEY;
    }
    return headers;
  }

  /**
   * Start a new WhatsApp session
   * Webhooks are automatically configured to send to API VRO backend
   */
  async startSession(sessionName: string): Promise<WAHASession> {
    const config: any = {
      name: sessionName,
    };

    // Always configure WAHA to send webhooks to API VRO backend
    // API VRO will then forward to user's webhook if configured
    const apiVroWebhookUrl = `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/v1/webhooks/incoming`;
    
    config.config = {
      webhooks: [
        {
          url: apiVroWebhookUrl,
          events: ['message', 'session.status'],
        },
      ],
    };

    const response = await fetch(`${this.baseUrl}/api/sessions/start`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(config),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to start session: ${error}`);
    }

    return response.json();
  }

  /**
   * Stop a WhatsApp session
   */
  async stopSession(sessionName: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/sessions/${sessionName}/stop`, {
      method: 'POST',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to stop session: ${error}`);
    }
  }

  /**
   * Delete a WhatsApp session completely
   */
  async deleteSession(sessionName: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/sessions/${sessionName}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to delete session: ${error}`);
    }
  }

  /**
   * Get session status
   */
  async getSessionStatus(sessionName: string): Promise<WAHASession> {
    const response = await fetch(`${this.baseUrl}/api/sessions/${sessionName}`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to get session status: ${error}`);
    }

    return response.json();
  }

  /**
   * Get QR code for session (returns image as base64)
   */
  async getQRCode(sessionName: string): Promise<WAHAQRCode> {
    const headers: HeadersInit = {};
    if (WAHA_API_KEY) {
      headers['X-Api-Key'] = WAHA_API_KEY;
    }

    const response = await fetch(`${this.baseUrl}/api/${sessionName}/auth/qr`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to get QR code: ${error}`);
    }

    // WAHA returns image, convert to base64
    const blob = await response.blob();
    const base64 = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });

    return {
      value: base64,
      base64: base64,
    };
  }

  /**
   * Get screenshot of WhatsApp session
   */
  async getScreenshot(sessionName: string): Promise<string> {
    const response = await fetch(`${this.baseUrl}/api/screenshot?session=${sessionName}`, {
      method: 'GET',
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to get screenshot: ${error}`);
    }

    // Return as base64 data URL
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  /**
   * Send text message
   */
  async sendText(
    sessionName: string,
    chatId: string,
    text: string
  ): Promise<WAHAMessageResponse> {
    const response = await fetch(`${this.baseUrl}/api/sendText`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        session: sessionName,
        chatId,
        text,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to send message: ${error}`);
    }

    return response.json();
  }

  /**
   * Send image message
   */
  async sendImage(
    sessionName: string,
    chatId: string,
    imageUrl: string,
    caption?: string
  ): Promise<WAHAMessageResponse> {
    const response = await fetch(`${this.baseUrl}/api/sendImage`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        session: sessionName,
        chatId,
        file: {
          url: imageUrl,
        },
        caption,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to send image: ${error}`);
    }

    return response.json();
  }

  /**
   * Check if WAHA server is running
   */
  async healthCheck(): Promise<boolean> {
    try {
      const headers: HeadersInit = {};
      if (WAHA_API_KEY) {
        headers['X-Api-Key'] = WAHA_API_KEY;
      }
      const response = await fetch(`${this.baseUrl}/api/sessions`, {
        method: 'GET',
        headers,
      });
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  /**
   * Logout session (disconnect WhatsApp)
   */
  async logout(sessionName: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/sessions/${sessionName}/logout`, {
      method: 'POST',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to logout: ${error}`);
    }
  }
}

// Export singleton instance
export const wahaClient = new WAHAClient();

// Helper function to convert phone number to WhatsApp chat ID
export function phoneToWAChatId(phone: string): string {
  // Remove any non-numeric characters
  const cleanPhone = phone.replace(/\D/g, '');
  // Add @c.us suffix for WhatsApp chat ID
  return `${cleanPhone}@c.us`;
}

// Helper function to map WAHA status to our database status
export function mapWAHAStatus(
  wahaStatus: WAHASession['status']
): 'connected' | 'disconnected' | 'scanning' {
  switch (wahaStatus) {
    case 'WORKING':
      return 'connected';
    case 'SCAN_QR_CODE':
      return 'scanning';
    case 'STOPPED':
    case 'STARTING':
    case 'FAILED':
    default:
      return 'disconnected';
  }
}
