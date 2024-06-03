"use client"

import {
  SignInButton,
  SignUpButton,
  UserButton,
  useAuth,
  useUser,
} from "@clerk/nextjs"
import { Button } from "./ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  BarChartIcon,
  ChevronDown,
  Clipboard,
  LogOutIcon,
  Plus,
  SettingsIcon,
  Star,
} from "lucide-react"
import Link from "next/link"
import { useQuery } from "convex/react"
import { api } from "../../convex/_generated/api"

export function HeaderAuthButtons() {
  const { isSignedIn } = useAuth()
  return (
    <div className="flex space-x-2">
      {!isSignedIn ? (
        <>
          <SignInButton mode="modal">
            <Button variant="ghost">Log In</Button>
          </SignInButton>
          <SignUpButton mode="modal">
            <Button className="bg-primary hover:bg-primary/90">Sign Up</Button>
          </SignUpButton>
        </>
      ) : (
        <UserProfileDropdown />
      )}
    </div>
  )
}

export function LogoutButton() {
  return <Button>Logout</Button>
}

function UserProfileDropdown() {
  const { user } = useUser()
  const convexUser = useQuery(api.users.currentUser, {})
  const { signOut } = useAuth()
  if (!user) return null
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          size="default"
          variant="ghost"
          className="!px-1 hover:!bg-secondary hover:shadow-sm"
        >
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage alt="@shadcn" src={user?.imageUrl} />
            </Avatar>
            <div className="flex items-center space-x-1">
              <span className="text-sm font-medium">{user?.firstName} </span>
              <span className="text-sm font-medium hidden md:block">
                {user?.lastName}
              </span>
              <ChevronDown size={15} />
            </div>
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem>
          <Link className="flex w-full items-center gap-2" href="/chat">
            <Plus className="h-4 w-4" />
            <span>New Chat</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Link className="flex w-full items-center gap-2" href="/account">
            <SettingsIcon className="h-4 w-4" />
            <span>Account Settings</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Link
            className="flex w-full items-center gap-2 text-primary font-medium"
            href="/reports"
          >
            <Clipboard className="h-4 w-4" />
            <span>Your Reports</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {convexUser?.admin && (
          <>
            <DropdownMenuItem>
              <Link
                className="flex w-full items-center gap-2 text-yellow-500 font-medium"
                href="/admin"
              >
                <Star className="h-4 w-4" />
                <span>Admin Panel</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
        <DropdownMenuItem onClick={() => signOut()}>
          <Link
            className="flex w-full items-center gap-2 text-red-600"
            href="#"
          >
            <LogOutIcon className="h-4 w-4" />
            <span>Logout</span>
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
