# AGENTS.md

## Контекст
Проект: Next.js + Supabase AG-Grid Views Management System.
Нужно реализовать приложение на Next.js с Supabase Auth и управлением представлениями AG-Grid (views). Пользователи могут создавать/редактировать/удалять только свои представления (RLS). Таблицы orders и invoices публичные (без user scope). Данные в сетке должны грузиться через SSR.

## Цели
- Создать Next.js приложение.
- Реализовать аутентификацию через Supabase (email/password, с подтверждением email).
- Реализовать CRUD для таблицы views с RLS (user-scoped).
- Реализовать переиспользуемый компонент AGGridTable с сохранением состояния колонок, сортировок, фильтров, загрузкой/переключением представлений.
- Реализовать страницы: /login, /dashboard, /invoices, /orders.
- Обеспечить SSR загрузку данных для grid.

## Стек и библиотеки
- Next.js (App Router).
- Supabase: `@supabase/supabase-js` и `@supabase/ssr` (обязательно).
- AG-Grid Community.

## Критичные требования Supabase SSR
- Запрещено использовать `auth-helpers-nextjs`.
- Разрешены ТОЛЬКО `getAll` и `setAll` в cookies; НЕЛЬЗЯ `get`/`set`/`remove`.
- Клиентский и серверный Supabase клиент — строго по шаблонам:

### Browser client
```
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  )
}
```

### Server client
```
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // setAll called from Server Component; ignore if proxy refresh is used
          }
        },
      },
    }
  )
}
```

### Proxy (middleware)
```
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (
    !user &&
    !request.nextUrl.pathname.startsWith('/login') &&
    !request.nextUrl.pathname.startsWith('/auth')
  ) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

## Функциональные требования
- Аутентификация:
  - Sign up (email/password) с подтверждением email.
  - Sign in (email/password).
  - Logout.
- CRUD для views (user-scoped):
  - Create view.
  - Load view.
  - Update view.
  - Delete view.
- View management UI:
  - Dropdown selector.
  - Save View.
  - Save As New View.
  - Reset to Default.
  - Индикатор несохраненных изменений.

## Данные и таблицы
### Invoices (публичные)
Поля:
- invoice_id (string)
- customer_name (string)
- customer_email (string)
- invoice_date (date)
- due_date (date)
- amount (number, currency)
- tax (number, percentage)
- total (number, computed)
- status (enum: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled')
- payment_method (string, nullable)
- notes (string, nullable)

Начальные видимые колонки:
- Invoice ID
- Customer Name
- Invoice Date
- Due Date
- Total
- Status

### Orders (публичные)
Поля:
- order_id (string)
- customer_name (string)
- customer_phone (string)
- order_date (date)
- shipping_address (string)
- items_count (number)
- subtotal (number)
- shipping_cost (number)
- discount (number, percentage)
- total (number, computed)
- status (enum: 'pending' | 'confirmed' | 'processing' | 'delivered')
- tracking_number (string, nullable)
- estimated_delivery (date, nullable)

Начальные видимые колонки:
- Order ID
- Customer Name
- Order Date
- Items Count
- Total
- Status
- Tracking Number

## Страницы
- /login
- /dashboard
- /invoices
- /orders

## Ограничения
- Данные для grid грузятся через SSR.
- Проект должен запускаться на чистом Supabase проекте.
- AG-Grid Community edition достаточно.

## Ожидания к реализации
- Четкая, повторно используемая архитектура AGGridTable.
- Типобезопасность (TypeScript).
- Корректная работа с состоянием views.
- Минимум внешних зависимостей.