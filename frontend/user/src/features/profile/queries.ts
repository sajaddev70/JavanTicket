import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { usePathname, useRouter } from "next/navigation";
import { profileService } from "@/services/profile.service";
import { queryKeys } from "@/constants/queryKeys";
import { errorMessage } from "@/services/api";
import { useAuthStore } from "@/stores/useAuthStore";
import { toast } from "@/stores/useToastStore";
import { loginHref } from "@/components/shared/RequireAuth";
import type { ProfileInput } from "@/types/user";

export const profileQueries = {
  profile: () => queryOptions({ queryKey: queryKeys.profile, queryFn: profileService.get }),
  favorites: () => queryOptions({ queryKey: queryKeys.favorites, queryFn: profileService.favorites }),
  favoriteIds: () => queryOptions({ queryKey: queryKeys.favoriteIds, queryFn: profileService.favoriteIds, staleTime: 5 * 60_000 }),
};

export function useProfile() {
  const authenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({ ...profileQueries.profile(), enabled: authenticated });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: ProfileInput) => profileService.update(input),
    onSuccess: (profile) => {
      qc.setQueryData(queryKeys.profile, profile);
      // Keep the name in the header in sync.
      const { user, updateUser } = useAuthStore.getState();
      if (user) updateUser({ ...user, fullName: profile.full_name, email: profile.email });
      toast.success("اطلاعات حساب کاربری ذخیره شد.");
    },
  });
}

export function useFavorites() {
  const authenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({ ...profileQueries.favorites(), enabled: authenticated });
}

/** Favorite state of events plus a toggle; signed-out visitors are sent to sign in first. */
export function useFavoriteToggle() {
  const qc = useQueryClient();
  const router = useRouter();
  const pathname = usePathname();
  const authenticated = useAuthStore((s) => s.isAuthenticated);
  const ids = useQuery({ ...profileQueries.favoriteIds(), enabled: authenticated }).data;

  const mutation = useMutation({
    mutationFn: ({ id, add }: { id: number; add: boolean }) => (add ? profileService.addFavorite(id) : profileService.removeFavorite(id)),
    onMutate: async ({ id, add }) => {
      await qc.cancelQueries({ queryKey: queryKeys.favoriteIds });
      const previous = qc.getQueryData<number[]>(queryKeys.favoriteIds);
      qc.setQueryData<number[]>(queryKeys.favoriteIds, (old = []) => (add ? [...old, id] : old.filter((x) => x !== id)));
      return { previous };
    },
    onError: (error, _vars, context) => {
      qc.setQueryData(queryKeys.favoriteIds, context?.previous);
      toast.error(errorMessage(error));
    },
    onSuccess: (_data, { add }) => toast.success(add ? "به علاقه‌مندی‌ها اضافه شد." : "از علاقه‌مندی‌ها حذف شد."),
    onSettled: () => qc.invalidateQueries({ queryKey: queryKeys.favorites }),
  });

  return {
    isFavorite: (id: number) => !!ids?.includes(id),
    toggle: (id: number) => {
      if (!authenticated) {
        router.push(loginHref(pathname));
        return;
      }
      mutation.mutate({ id, add: !ids?.includes(id) });
    },
  };
}
