import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
    // Check if Supabase environment variables are available
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    // If environment variables are missing, allow request to proceed without auth check
    if (!supabaseUrl || !supabaseAnonKey) {
        console.warn('Supabase environment variables not found. Auth checks disabled.');
        return NextResponse.next({
            request: {
                headers: request.headers,
            },
        });
    }

    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    const supabase = createServerClient(
        supabaseUrl,
        supabaseAnonKey,
        {
            cookies: {
                get(name: string) {
                    return request.cookies.get(name)?.value
                },
                set(name: string, value: string, options: CookieOptions) {
                    request.cookies.set({
                        name,
                        value,
                        ...options,
                    })
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    })
                    response.cookies.set({
                        name,
                        value,
                        ...options,
                    })
                },
                remove(name: string, options: CookieOptions) {
                    request.cookies.set({
                        name,
                        value: '',
                        ...options,
                    })
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    })
                    response.cookies.set({
                        name,
                        value: '',
                        ...options,
                    })
                },
            },
        }
    )

    const { data: { user } } = await supabase.auth.getUser();

    // Public routes that don't require authentication
    const publicRoutes = ['/login', '/signup', '/'];
    const isPublicRoute = publicRoutes.includes(request.nextUrl.pathname);

    // Onboarding route
    const isOnboardingRoute = request.nextUrl.pathname === '/onboarding';

    // If user is logged in
    if (user) {
        // Check if user has completed onboarding
        const onboardingCompleted = user.user_metadata?.onboarding_completed;

        // If onboarding not completed and not on onboarding page, redirect to onboarding
        if (!onboardingCompleted && !isOnboardingRoute && !isPublicRoute) {
            return NextResponse.redirect(new URL('/onboarding', request.url));
        }

        // If onboarding completed and trying to access onboarding, redirect to interview-type
        if (onboardingCompleted && isOnboardingRoute) {
            return NextResponse.redirect(new URL('/interview-type', request.url));
        }

        // If logged in and trying to access login/signup, redirect to interview-type
        if (isPublicRoute && request.nextUrl.pathname !== '/') {
            return NextResponse.redirect(new URL('/interview-type', request.url));
        }
    } else {
        // If not logged in and trying to access protected routes, redirect to login
        if (!isPublicRoute && !isOnboardingRoute) {
            return NextResponse.redirect(new URL('/login', request.url));
        }

        // If not logged in but trying to access onboarding, redirect to login
        if (isOnboardingRoute) {
            return NextResponse.redirect(new URL('/login', request.url));
        }
    }

    return response
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
