<template>
  <div class="flex flex-col h-screen">
    <Suspense>
      <UApp :toaster="{ expand: true }">
        <Header />
        <UMain>
          <RouterView />
        </UMain>
      </UApp>
    </Suspense>
  </div>
</template>
