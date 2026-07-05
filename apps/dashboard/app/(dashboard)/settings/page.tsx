import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input } from "@tael/ui";
import { PageHeader } from "../../../components/page-header";

export default function SettingsPage() {
  return (
    <>
      <PageHeader
        title="Settings"
        description="Manage your profile, appearance, and preferences."
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Profile</CardTitle>
            <CardDescription>Your account details.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input placeholder="Name" defaultValue="Demo User" />
            <Input type="email" placeholder="Email" defaultValue="demo@tael.dev" />
            <Button size="sm">Save changes</Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Appearance</CardTitle>
            <CardDescription>Switch themes from the toggle in the top bar.</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Light and dark themes are provided by the shared design system.
          </CardContent>
        </Card>
      </div>
    </>
  );
}
