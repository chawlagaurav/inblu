'use client'

import { useState } from 'react'
import { Save, Store, Mail, CreditCard, Bell, Shield, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { FadeIn, StaggerContainer, StaggerItem } from '@/components/motion'
import { toast } from 'sonner'

export default function AdminSettingsPage() {
  const [isSaving, setIsSaving] = useState(false)
  const [settings, setSettings] = useState({
    storeName: 'Inblu',
    storeEmail: 'support@inblu.com',
    storePhone: '+61 2 1234 5678',
    storeAddress: '123 Main Street, Sydney NSW 2000, Australia',
    currency: 'AUD',
    taxRate: '10',
    lowStockThreshold: '10',
    orderPrefix: 'INB',
    emailNotifications: true,
    lowStockAlerts: true,
    newOrderAlerts: true,
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    if (type === 'checkbox') {
      setSettings({ ...settings, [name]: (e.target as HTMLInputElement).checked })
    } else {
      setSettings({ ...settings, [name]: value })
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    toast.success('Settings saved successfully')
    setIsSaving(false)
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <FadeIn>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Settings</h1>
          <p className="text-slate-500 mt-1">Configure your store settings</p>
        </div>
      </FadeIn>

      <StaggerContainer className="space-y-6">
        {/* Store Information */}
        <StaggerItem>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Store className="h-5 w-5 text-sky-600" />
                Store Information
              </CardTitle>
              <CardDescription>Basic store details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="storeName">Store Name</Label>
                  <Input
                    id="storeName"
                    name="storeName"
                    value={settings.storeName}
                    onChange={handleChange}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="storeEmail">Contact Email</Label>
                  <Input
                    id="storeEmail"
                    name="storeEmail"
                    type="email"
                    value={settings.storeEmail}
                    onChange={handleChange}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="storePhone">Phone Number</Label>
                  <Input
                    id="storePhone"
                    name="storePhone"
                    value={settings.storePhone}
                    onChange={handleChange}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="orderPrefix">Order Prefix</Label>
                  <Input
                    id="orderPrefix"
                    name="orderPrefix"
                    value={settings.orderPrefix}
                    onChange={handleChange}
                    className="mt-1"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="storeAddress">Store Address</Label>
                <Textarea
                  id="storeAddress"
                  name="storeAddress"
                  value={settings.storeAddress}
                  onChange={handleChange}
                  rows={2}
                  className="mt-1"
                />
              </div>
            </CardContent>
          </Card>
        </StaggerItem>

        {/* Payment Settings */}
        <StaggerItem>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-sky-600" />
                Payment Settings
              </CardTitle>
              <CardDescription>Configure payment and tax</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="currency">Currency</Label>
                  <Input
                    id="currency"
                    name="currency"
                    value={settings.currency}
                    onChange={handleChange}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="taxRate">Tax Rate (%)</Label>
                  <Input
                    id="taxRate"
                    name="taxRate"
                    type="number"
                    value={settings.taxRate}
                    onChange={handleChange}
                    className="mt-1"
                  />
                </div>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl">
                <p className="text-sm text-slate-600">
                  <strong>Stripe Integration:</strong> Payment processing is handled by Stripe. 
                  Configure your Stripe keys in the environment variables.
                </p>
              </div>
            </CardContent>
          </Card>
        </StaggerItem>

        {/* Inventory Settings */}
        <StaggerItem>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-sky-600" />
                Inventory Settings
              </CardTitle>
              <CardDescription>Stock management preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="lowStockThreshold">Low Stock Threshold</Label>
                <Input
                  id="lowStockThreshold"
                  name="lowStockThreshold"
                  type="number"
                  value={settings.lowStockThreshold}
                  onChange={handleChange}
                  className="mt-1 max-w-xs"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Products with stock below this number will be flagged as low stock
                </p>
              </div>
            </CardContent>
          </Card>
        </StaggerItem>

        {/* Notification Settings */}
        <StaggerItem>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-sky-600" />
                Notifications
              </CardTitle>
              <CardDescription>Email and alert preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="emailNotifications"
                  name="emailNotifications"
                  checked={settings.emailNotifications}
                  onChange={handleChange}
                  className="rounded border-sky-300 text-sky-600 focus:ring-sky-500"
                />
                <div>
                  <Label htmlFor="emailNotifications">Email Notifications</Label>
                  <p className="text-xs text-slate-500">Receive email notifications for important events</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="newOrderAlerts"
                  name="newOrderAlerts"
                  checked={settings.newOrderAlerts}
                  onChange={handleChange}
                  className="rounded border-sky-300 text-sky-600 focus:ring-sky-500"
                />
                <div>
                  <Label htmlFor="newOrderAlerts">New Order Alerts</Label>
                  <p className="text-xs text-slate-500">Get notified when a new order is placed</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="lowStockAlerts"
                  name="lowStockAlerts"
                  checked={settings.lowStockAlerts}
                  onChange={handleChange}
                  className="rounded border-sky-300 text-sky-600 focus:ring-sky-500"
                />
                <div>
                  <Label htmlFor="lowStockAlerts">Low Stock Alerts</Label>
                  <p className="text-xs text-slate-500">Get notified when products are running low</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </StaggerItem>

        {/* Save Button */}
        <StaggerItem>
          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Settings
                </>
              )}
            </Button>
          </div>
        </StaggerItem>
      </StaggerContainer>
    </div>
  )
}
