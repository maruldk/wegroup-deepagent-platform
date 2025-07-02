
'use client';

import { useState } from 'react';
import { signIn, getSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Building2, 
  User, 
  Mail, 
  Eye, 
  EyeOff, 
  Shield, 
  Crown, 
  Users, 
  Briefcase, 
  ShoppingCart, 
  Wrench,
  Star,
  CheckCircle2,
  AlertCircle,
  Loader2
} from 'lucide-react';
import Image from 'next/image';

// Demo Users organized by categories matching mockups
const DEMO_USERS = {
  administrators: [
    {
      name: 'John Doe',
      email: 'john@doe.com',
      password: 'johndoe123',
      role: 'Super Admin',
      description: 'Global Administrator mit Zugriff auf alle weGROUP Unternehmen',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
      tenants: ['Alle 8 Mandanten'],
      icon: Shield,
      badgeColor: 'bg-red-500'
    },
    {
      name: 'Admin Weber',
      email: 'admin@wegroup.de',
      password: 'admin123',
      role: 'Tenant Admin',
      description: 'weGROUP Mandanten-Administrator',
      avatar: 'https://img.freepik.com/premium-photo/cropped-portrait-person_1048944-1696425.jpg',
      tenants: ['weGROUP GmbH'],
      icon: User,
      badgeColor: 'bg-orange-500'
    }
  ],
  clevel: [
    {
      name: 'Dr. Michael Richter',
      email: 'ceo@wegroup.de',
      password: 'ceo123',
      role: 'CEO weGROUP',
      description: 'Chief Executive Officer - Strategische Unternehmensführung',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
      tenants: ['Alle weGROUP Unternehmen'],
      icon: Crown,
      badgeColor: 'bg-purple-500'
    },
    {
      name: 'Dr. Sabine Fischer',
      email: 'cfo@wegroup.de',
      password: 'cfo123',
      role: 'CFO weGROUP',
      description: 'Chief Financial Officer - Finanzmanagement & Controlling',
      avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&h=150&fit=crop&crop=face',
      tenants: ['Alle weGROUP Unternehmen'],
      icon: Crown,
      badgeColor: 'bg-purple-500'
    },
    {
      name: 'Max Mustermann',
      email: 'max.mustermann@depancon.de',
      password: 'max123',
      role: 'CEO DePanCon',
      description: 'CEO - DePanCon GmbH Consulting & Projektmanagement',
      avatar: 'https://img.freepik.com/premium-photo/cropped-portrait-woman_1048944-12011716.jpg',
      tenants: ['DePanCon GmbH', 'weGROUP GmbH'],
      icon: Briefcase,
      badgeColor: 'bg-blue-500'
    },
    {
      name: 'Sandra Schmidt',
      email: 'sandra.schmidt@abundance.de',
      password: 'sandra123',
      role: 'CFO Abundance',
      description: 'CFO - Abundance GmbH Business Development',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
      tenants: ['Abundance GmbH', 'weGROUP GmbH'],
      icon: Briefcase,
      badgeColor: 'bg-green-500'
    }
  ],
  management: [
    {
      name: 'Thomas Wagner',
      email: 'thomas.wagner@wfs.de',
      password: 'thomas123',
      role: 'Abteilungsleiter',
      description: 'Head of Logistics - WFS Fulfillment Solutions',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
      tenants: ['WFS Fulfillment Solutions GmbH'],
      icon: Users,
      badgeColor: 'bg-orange-600'
    },
    {
      name: 'Lisa Zimmermann',
      email: 'lisa.zimmermann@wecreate.de',
      password: 'lisa123',
      role: 'Projektmanager',
      description: 'Creative Project Manager - weCREATE GmbH',
      avatar: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=150&h=150&fit=crop&crop=face',
      tenants: ['weCREATE GmbH'],
      icon: Briefcase,
      badgeColor: 'bg-pink-500'
    }
  ],
  operative: [
    {
      name: 'David Klein',
      email: 'david.klein@wesell.de',
      password: 'david123',
      role: 'Senior Mitarbeiter',
      description: 'Senior Sales Manager - weSELL GmbH',
      avatar: 'https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=150&h=150&fit=crop&crop=face',
      tenants: ['weSELL GmbH'],
      icon: ShoppingCart,
      badgeColor: 'bg-blue-600'
    },
    {
      name: 'Julia Hoffmann',
      email: 'julia.hoffmann@wetzlar-industry.de',
      password: 'julia123',
      role: 'Mitarbeiter',
      description: 'Manufacturing Engineer - Wetzlar Industry Solutions',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face',
      tenants: ['Wetzlar Industry Solutions GmbH'],
      icon: Wrench,
      badgeColor: 'bg-gray-600'
    }
  ],
  customers: [
    {
      name: 'Tech-Startup CEO',
      email: 'startup@techvisio.com',
      password: 'startup123',
      role: 'Kunde',
      description: 'CEO - Tech-Visio Startup (weVENTURES Client)',
      avatar: 'https://images.unsplash.com/photo-1507591064344-4c6ce005b128?w=150&h=150&fit=crop&crop=face',
      tenants: ['weVENTURES GmbH'],
      icon: Star,
      badgeColor: 'bg-teal-500'
    },
    {
      name: 'Manufacturing Director',
      email: 'director@industrial-client.com',
      password: 'manufacturing123',
      role: 'Kunde',
      description: 'Operations Director - Industrial Manufacturing Client',
      avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&h=150&fit=crop&crop=face',
      tenants: ['Wetzlar Industry Solutions GmbH'],
      icon: Wrench,
      badgeColor: 'bg-gray-500'
    },
    {
      name: 'E-Commerce Manager',
      email: 'manager@ecommerce-client.com',
      password: 'ecommerce123',
      role: 'Kunde',
      description: 'E-Commerce Operations Manager (weSELL Client)',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&h=150&fit=crop&crop=face',
      tenants: ['weSELL GmbH'],
      icon: ShoppingCart,
      badgeColor: 'bg-indigo-500'
    }
  ],
  suppliers: [
    {
      name: 'Supplier Coordinator',
      email: 'coord@logistics-supplier.com',
      password: 'supplier123',
      role: 'Lieferant',
      description: 'Supply Chain Coordinator - Logistics Partner',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop&crop=face',
      tenants: ['WFS Fulfillment Solutions GmbH'],
      icon: Building2,
      badgeColor: 'bg-amber-600'
    },
    {
      name: 'Software Vendor',
      email: 'vendor@software-partner.com',
      password: 'vendor123',
      role: 'Lieferant',
      description: 'Software Solutions Vendor - Technology Partner',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
      tenants: ['weGROUP GmbH'],
      icon: Building2,
      badgeColor: 'bg-cyan-600'
    }
  ]
};

const CATEGORY_LABELS = {
  administrators: 'Administratoren',
  clevel: 'C-Level',
  management: 'Management',
  operative: 'Operative',
  customers: 'Kunden',
  suppliers: 'Lieferanten'
};

export default function LoginPage() {
  const [isManualLogin, setIsManualLogin] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleDemoLogin = async (demoUser: any) => {
    console.log('Starting demo login for:', demoUser.name, demoUser.email);
    setIsLoading(true);
    setError('');
    
    try {
      console.log('Calling signIn with credentials:', { email: demoUser.email, password: '***' });
      
      // Use NextAuth signIn with callbackUrl
      const result = await signIn('credentials', {
        email: demoUser.email,
        password: demoUser.password,
        callbackUrl: '/dashboard',
        redirect: true, // Let NextAuth handle the redirect
      });

      console.log('SignIn result:', result);
      
      // If redirect is true, this code won't execute on success
      // Only on error
      if (result?.error) {
        console.error('SignIn error:', result.error);
        setError(`Anmeldung fehlgeschlagen: ${result.error}`);
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Demo login error:', error);
      setError(`Ein unerwarteter Fehler ist aufgetreten: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`);
      setIsLoading(false);
    }
    // Note: setIsLoading(false) is not in finally, because successful login will redirect
  };

  const handleManualLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError('Ungültige Anmeldedaten. Bitte überprüfen Sie Email und Passwort.');
      } else {
        router.push('/dashboard');
      }
    } catch (error) {
      setError('Ein unerwarteter Fehler ist aufgetreten.');
    } finally {
      setIsLoading(false);
    }
  };

  const DemoUserCard = ({ user, category }: { user: any; category: string }) => {
    const IconComponent = user.icon;
    
    const handleCardClick = async (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      console.log('Demo user clicked:', user.name, user.email);
      await handleDemoLogin(user);
    };
    
    return (
      <Card className={`hover:shadow-lg transition-all duration-200 hover:scale-[1.02] cursor-pointer group ${isLoading ? 'opacity-50 pointer-events-none' : ''}`} 
            onClick={handleCardClick}>
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <div className="relative">
              <Avatar className="h-12 w-12">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback>
                  <IconComponent className="h-6 w-6" />
                </AvatarFallback>
              </Avatar>
              <Badge className={`absolute -top-1 -right-1 p-1 ${user.badgeColor} text-white`}>
                {isLoading ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <IconComponent className="h-3 w-3" />
                )}
              </Badge>
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <h4 className="font-semibold text-sm text-gray-900 truncate">{user.name}</h4>
                {isLoading ? (
                  <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 text-green-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                )}
              </div>
              
              <p className="text-xs text-gray-600 mb-1">{user.role}</p>
              <p className="text-xs text-gray-500 line-clamp-2 mb-2">{user.description}</p>
              
              <div className="flex flex-wrap gap-1">
                {user.tenants?.map((tenant: string, index: number) => (
                  <Badge key={index} variant="outline" className="text-xs px-1 py-0">
                    {tenant}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="relative">
              <Image
                src="https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=120&h=120&fit=crop&crop=center"
                alt="weGROUP Logo"
                width={80}
                height={80}
                className="rounded-2xl shadow-lg"
              />
              <div className="absolute inset-0 bg-blue-600 bg-opacity-20 rounded-2xl"></div>
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">weGROUP DeepAgent</h1>
          <p className="text-lg text-gray-600">Multi-Tenant Enterprise Platform</p>
          <p className="text-sm text-gray-500 mt-2">
            Wählen Sie einen Demo-Benutzer oder melden Sie sich manuell an
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Demo Users Section */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="h-5 w-5 text-blue-600" />
                  <span>Demo-Benutzer</span>
                </CardTitle>
                <CardDescription>
                  Klicken Sie auf einen Benutzer für sofortigen Zugang
                </CardDescription>
              </CardHeader>
              <CardContent>
                {error && (
                  <div className="flex items-center space-x-2 text-sm text-red-600 bg-red-50 p-3 rounded-md mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <span>{error}</span>
                  </div>
                )}
                
                <Tabs defaultValue="administrators" className="w-full">
                  <TabsList className="grid w-full grid-cols-6 mb-6">
                    {Object.keys(DEMO_USERS).map((category) => (
                      <TabsTrigger 
                        key={category} 
                        value={category}
                        className="text-xs"
                      >
                        {CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS]}
                      </TabsTrigger>
                    ))}
                  </TabsList>

                  {Object.entries(DEMO_USERS).map(([category, users]) => (
                    <TabsContent key={category} value={category} className="mt-0">
                      <div className="grid gap-3">
                        {users.map((user, index) => (
                          <DemoUserCard key={index} user={user} category={category} />
                        ))}
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Manual Login Section */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Mail className="h-5 w-5 text-gray-600" />
                  <span>Manuelle Anmeldung</span>
                </CardTitle>
                <CardDescription>
                  Oder verwenden Sie Ihre eigenen Anmeldedaten
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleManualLogin} className="space-y-4">
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="ihre.email@wegroup.de"
                      required
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="password">Passwort</Label>
                    <div className="relative mt-1">
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-gray-400" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-400" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {error && (
                    <div className="flex items-center space-x-2 text-sm text-red-600 bg-red-50 p-3 rounded-md">
                      <AlertCircle className="h-4 w-4" />
                      <span>{error}</span>
                    </div>
                  )}

                  <Button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : null}
                    Anmelden
                  </Button>
                </form>

                <Separator className="my-6" />

                <div className="space-y-3">
                  <div className="text-xs text-gray-500 text-center mb-3">
                    Empfohlene Demo-Accounts:
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start text-xs"
                    onClick={() => handleDemoLogin(DEMO_USERS.administrators[0])}
                  >
                    <Shield className="h-3 w-3 mr-2" />
                    john@doe.com (Super Admin)
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start text-xs"
                    onClick={() => handleDemoLogin(DEMO_USERS.clevel[0])}
                  >
                    <Crown className="h-3 w-3 mr-2" />
                    ceo@wegroup.de (CEO)
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* System Info */}
            <Card className="mt-4">
              <CardContent className="p-4">
                <div className="text-center">
                  <Building2 className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <h3 className="font-semibold text-sm mb-1">weGROUP Ecosystem</h3>
                  <p className="text-xs text-gray-500 mb-3">
                    8 Mandanten • 6 Benutzerrollen • Enterprise-Security
                  </p>
                  <div className="flex items-center justify-center space-x-1 text-xs text-green-600">
                    <CheckCircle2 className="h-3 w-3" />
                    <span>System Online</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-xs text-gray-500">
          <p>© 2024 weGROUP GmbH • Alle Rechte vorbehalten</p>
          <p className="mt-1">DeepAgent Platform v2.0 • Multi-Tenant Enterprise Solution</p>
        </div>
      </div>
    </div>
  );
}
