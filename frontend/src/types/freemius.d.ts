interface FreemiusCheckoutInstance {
  open: (opts: Record<string, unknown>) => void
  close: () => void
}

declare global {
  interface Window {
    FS: {
      Checkout: new (config: {
        product_id: string
        plan_id: number
        public_key: string
        image?: string
      }) => FreemiusCheckoutInstance
    }
  }
}

export {}
