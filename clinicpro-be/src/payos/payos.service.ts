import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PayOS, APIError, InvalidSignatureError } from '@payos/node';

export interface PayOsCreatePaymentPayload {
  orderCode: string | number;
  amount: number;
  description: string;
  returnUrl?: string;
  cancelUrl?: string;
  buyerName?: string;
  buyerEmail?: string;
  buyerPhone?: string;
  expiredAt?: number;
  items?: Array<{ name: string; quantity: number; price: number }>;
  metadata?: Record<string, any>;
}

export interface PayOsPaymentLink {
  transactionId: string;
  orderCode?: string;
  amount: number;
  currency?: string;
  status?: string;
  paymentUrl?: string;
  qrCode?: string;
  expiredAt?: number;
  raw: any;
}

@Injectable()
export class PayOsService {
  private readonly logger = new Logger(PayOsService.name);
  private readonly baseUrl: string;
  private readonly clientId: string;
  private readonly apiKey: string;
  private readonly checksumKey: string;
  private readonly returnUrl?: string;
  private readonly cancelUrl?: string;
  private readonly payosClient?: PayOS;
  private readonly testMode: boolean;

  constructor(private readonly configService: ConfigService) {
    this.baseUrl =
      this.configService.get<string>('PAYOS_BASE_URL')?.trim() ??
      'https://api.payos.vn';
    this.clientId = this.configService.get<string>('PAYOS_CLIENT_ID')?.trim() ?? '';
    this.apiKey = this.configService.get<string>('PAYOS_API_KEY')?.trim() ?? '';
    this.checksumKey =
      this.configService.get<string>('PAYOS_CHECKSUM_KEY')?.trim() ?? '';
    this.returnUrl = this.configService.get<string>('PAYOS_RETURN_URL')?.trim();
    this.cancelUrl = this.configService.get<string>('PAYOS_CANCEL_URL')?.trim();
    this.testMode =
      this.configService.get<string>('PAYOS_TEST_MODE')?.toLowerCase() === 'true';

    if (this.testMode) {
      this.logger.warn('🧪 PayOS TEST MODE enabled. QR payments will use mock data. DO NOT use in production!');
      return;
    }

    const disablePayos = this.configService.get<string>('DISABLE_PAYOS')?.toLowerCase() === 'true';
    if (disablePayos || !this.clientId || !this.apiKey || !this.checksumKey) {
      if (disablePayos) {
        this.logger.warn('PayOS is disabled (DISABLE_PAYOS=true). Chỉ dùng tiền mặt/chuyển khoản.');
      } else {
        this.logger.warn(
          'PayOS credentials are not fully configured. Transfer payments will be disabled.',
        );
      }
      return;
    }

    this.payosClient = new PayOS({
      clientId: this.clientId,
      apiKey: this.apiKey,
      checksumKey: this.checksumKey,
      baseURL: this.baseUrl,
    });
  }

  isEnabled(): boolean {
    return this.testMode || Boolean(this.payosClient);
  }

  isTestMode(): boolean {
    return this.testMode;
  }

  async createPaymentLink(
    payload: PayOsCreatePaymentPayload,
  ): Promise<PayOsPaymentLink> {
    // --- TEST MODE: generate mock payment link ---
    if (this.testMode) {
      return this.createMockPaymentLink(payload);
    }

    if (!this.payosClient) {
      throw new Error('PayOS credentials are not configured.');
    }

    const normalizedOrderCode = this.normalizeOrderCode(payload.orderCode);

    try {
      const requestBody: Record<string, any> = {
        orderCode: normalizedOrderCode as any,
        amount: payload.amount,
        description: payload.description,
        items: payload.items,
        buyerName: payload.buyerName,
        buyerEmail: payload.buyerEmail,
        buyerPhone: payload.buyerPhone,
        expiredAt: payload.expiredAt,
      };

      const returnUrl = payload.returnUrl ?? this.returnUrl;
      const cancelUrl = payload.cancelUrl ?? this.cancelUrl;

      if (returnUrl) {
        requestBody.returnUrl = returnUrl;
      }

      if (cancelUrl) {
        requestBody.cancelUrl = cancelUrl;
      }

      const response = await this.payosClient.paymentRequests.create(
        requestBody as any,
      );

      return this.mapPaymentLinkResponse(response, {
        fallbackOrderCode: normalizedOrderCode,
        raw: response,
      });
    } catch (error) {
      if (error instanceof APIError) {
        this.logger.error(
          `PayOS trả về lỗi code=${error.code ?? error.status} desc=${error.desc ?? error.message}`,
        );
        throw new Error(
          `PayOS từ chối yêu cầu: ${error.desc ?? error.message ?? 'Lỗi không xác định'}`,
        );
      }

      this.logger.error(
        `Failed to create PayOS payment link for orderCode=${payload.orderCode}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  async verifyWebhook(
    signature: string | undefined,
    payload: any,
  ): Promise<PayOsPaymentLink | null> {
    // --- TEST MODE: accept any webhook payload ---
    if (this.testMode) {
      const rawPayload =
        typeof payload === 'string' ? JSON.parse(payload) : payload ?? {};
      this.logger.log(`🧪 [TEST] Webhook received: orderCode=${rawPayload?.orderCode ?? rawPayload?.data?.orderCode ?? 'N/A'}`);
      return this.mapPaymentLinkResponse(
        { status: 'PAID', ...rawPayload },
        { fallbackOrderCode: rawPayload?.orderCode ?? rawPayload?.data?.orderCode, raw: rawPayload },
      );
    }

    if (!this.payosClient || !signature) {
      return null;
    }

    const rawPayload =
      typeof payload === 'string' ? JSON.parse(payload) : payload ?? {};

    try {
      const verified = await this.payosClient.webhooks.verify({
        ...rawPayload,
        signature,
      });

      return this.mapPaymentLinkResponse(verified, {
        fallbackOrderCode: verified?.orderCode,
        raw: rawPayload,
      });
    } catch (error) {
      if (error instanceof InvalidSignatureError) {
        this.logger.warn('PayOS webhook signature không hợp lệ.');
        return null;
      }

      if (error instanceof APIError) {
        this.logger.error(
          `PayOS webhook verify lỗi code=${error.code ?? error.status} desc=${error.desc ?? error.message}`,
        );
      }

      throw error;
    }
  }

  private mapPaymentLinkResponse(
    data: any,
    options?: { fallbackOrderCode?: string | number; raw?: any },
  ): PayOsPaymentLink {
    if (!data) {
      return {
        transactionId: 'unknown',
        amount: 0,
        raw: options?.raw ?? data,
      };
    }

    const raw = options?.raw ?? data;
    const payload = data?.data ?? data;
    const orderCodeValue =
      options?.fallbackOrderCode ??
      payload?.orderCode ??
      payload?.order_code ??
      raw?.orderCode ??
      raw?.order_code ??
      raw?.data?.orderCode ??
      raw?.data?.order_code;

    return {
      transactionId:
        payload?.paymentLinkId ??
        payload?.id ??
        payload?.transactionId ??
        payload?.transaction_id ??
        raw?.paymentLinkId ??
        raw?.data?.paymentLinkId ??
        'unknown',
      orderCode:
        orderCodeValue !== undefined ? String(orderCodeValue) : undefined,
      amount:
        payload?.amount ??
        payload?.totalAmount ??
        raw?.amount ??
        raw?.data?.amount ??
        0,
      currency:
        payload?.currency ??
        raw?.currency ??
        raw?.data?.currency ??
        'VND',
      status:
        payload?.status ??
        raw?.status ??
        raw?.data?.status ??
        undefined,
      paymentUrl:
        payload?.checkoutUrl ??
        payload?.paymentUrl ??
        payload?.shortLink ??
        raw?.checkoutUrl ??
        raw?.paymentUrl,
      qrCode:
        payload?.qrCode ??
        payload?.qrCodeUrl ??
        raw?.qrCode ??
        raw?.data?.qrCode,
      expiredAt:
        payload?.expiredAt ??
        payload?.expireAt ??
        payload?.expiresAt ??
        raw?.expiredAt ??
        raw?.data?.expiredAt,
      raw,
    };
  }

  private normalizeOrderCode(orderCode: string | number): number | string {
    if (typeof orderCode === 'number' && Number.isSafeInteger(orderCode)) {
      return orderCode;
    }

    if (!orderCode) {
      return Date.now();
    }

    const digitsOnly = String(orderCode).replace(/\D/g, '');
    if (digitsOnly.length === 0) {
      return Date.now();
    }

    const numeric = Number(digitsOnly);
    if (!Number.isSafeInteger(numeric)) {
      this.logger.warn(
        `OrderCode ${orderCode} vượt quá giới hạn số an toàn. Dùng timestamp thay thế.`,
      );
      return Date.now();
    }

    return numeric;
  }

  /**
   * Generate a mock payment link for TEST MODE.
   * Creates fake transaction data simulating a real PayOS response.
   */
  private createMockPaymentLink(
    payload: PayOsCreatePaymentPayload,
  ): PayOsPaymentLink {
    const normalizedOrderCode = this.normalizeOrderCode(payload.orderCode);
    const mockTransactionId = `TEST-TXN-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    // Generate a simple QR-like SVG placeholder (real QR would be scanned by banking app)
    const mockQrSvg = this.generateMockQrSvg(normalizedOrderCode, payload.amount);
    const mockQrBase64 = Buffer.from(mockQrSvg).toString('base64');

    // Mock payment URL - in real life this would be a PayOS checkout page
    const mockPaymentUrl = `http://localhost:3001/test/payos-checkout?orderCode=${normalizedOrderCode}&amount=${payload.amount}`;

    this.logger.log('═══════════════════════════════════════');
    this.logger.log(`🧪 [PAYOS TEST MODE] Tạo liên kết thanh toán giả lập:`);
    this.logger.log(`   📋 Mã đơn: ${normalizedOrderCode}`);
    this.logger.log(`   💰 Số tiền: ${payload.amount.toLocaleString('vi-VN')} VND`);
    this.logger.log(`   📝 Mô tả: ${payload.description}`);
    this.logger.log(`   🔗 Payment URL: ${mockPaymentUrl}`);
    this.logger.log(`   🆔 Transaction ID: ${mockTransactionId}`);
    this.logger.log(`   👤 Người mua: ${payload.buyerName ?? 'N/A'}`);
    this.logger.log(`   ⏰ Hết hạn: ${payload.expiredAt ? new Date(payload.expiredAt * 1000).toISOString() : 'N/A'}`);
    this.logger.log('   ℹ️  Dùng nút "Xác nhận thủ công" để hoàn tất thanh toán test');
    this.logger.log('═══════════════════════════════════════');

    return {
      transactionId: mockTransactionId,
      orderCode: String(normalizedOrderCode),
      amount: payload.amount,
      currency: 'VND',
      status: 'PENDING',
      paymentUrl: mockPaymentUrl,
      qrCode: `data:image/svg+xml;base64,${mockQrBase64}`,
      expiredAt: payload.expiredAt,
      raw: {
        data: {
          paymentLinkId: mockTransactionId,
          orderCode: normalizedOrderCode,
          amount: payload.amount,
          status: 'PENDING',
          checkoutUrl: mockPaymentUrl,
          qrCode: `data:image/svg+xml;base64,${mockQrBase64}`,
          description: payload.description,
        },
      },
    };
  }

  /**
   * Generate a simple SVG QR-like placeholder for test mode.
   * Not a real QR code, but shows payment info visually.
   */
  private generateMockQrSvg(orderCode: number | string, amount: number): string {
    const formattedAmount = new Intl.NumberFormat('vi-VN').format(amount);
    return `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
  <rect width="200" height="200" fill="#ffffff" rx="8"/>
  <rect x="10" y="10" width="180" height="180" fill="none" stroke="#1a56db" stroke-width="3" rx="4"/>
  <text x="100" y="55" text-anchor="middle" font-family="Arial,sans-serif" font-size="14" font-weight="bold" fill="#1a56db">ClinicPro</text>
  <text x="100" y="75" text-anchor="middle" font-family="Arial,sans-serif" font-size="11" fill="#374151">Thanh toán Test</text>
  <line x1="30" y1="90" x2="170" y2="90" stroke="#e5e7eb" stroke-width="1"/>
  <text x="100" y="112" text-anchor="middle" font-family="Arial,sans-serif" font-size="13" font-weight="bold" fill="#059669">${formattedAmount} VND</text>
  <text x="100" y="132" text-anchor="middle" font-family="monospace" font-size="10" fill="#6b7280">Order: ${orderCode}</text>
  <text x="100" y="155" text-anchor="middle" font-family="Arial,sans-serif" font-size="9" fill="#9ca3af">🧪 TEST MODE</text>
  <!-- QR pattern simulation -->
  <rect x="45" y="160" width="8" height="8" fill="#1a56db"/>
  <rect x="57" y="160" width="8" height="8" fill="#1a56db"/>
  <rect x="69" y="160" width="8" height="8" fill="#1a56db"/>
  <rect x="93" y="160" width="8" height="8" fill="#1a56db"/>
  <rect x="105" y="160" width="8" height="8" fill="#1a56db"/>
  <rect x="117" y="160" width="8" height="8" fill="#1a56db"/>
  <rect x="129" y="160" width="8" height="8" fill="#1a56db"/>
  <rect x="141" y="160" width="8" height="8" fill="#1a56db"/>
  <rect x="45" y="172" width="8" height="8" fill="#1a56db"/>
  <rect x="69" y="172" width="8" height="8" fill="#1a56db"/>
  <rect x="81" y="172" width="8" height="8" fill="#1a56db"/>
  <rect x="105" y="172" width="8" height="8" fill="#1a56db"/>
  <rect x="129" y="172" width="8" height="8" fill="#1a56db"/>
  <rect x="141" y="172" width="8" height="8" fill="#1a56db"/>
  <rect x="57" y="184" width="8" height="8" fill="#1a56db"/>
  <rect x="81" y="184" width="8" height="8" fill="#1a56db"/>
  <rect x="93" y="184" width="8" height="8" fill="#1a56db"/>
  <rect x="117" y="184" width="8" height="8" fill="#1a56db"/>
</svg>`;
  }
}
