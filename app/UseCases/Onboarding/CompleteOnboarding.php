<?php

namespace App\UseCases\Onboarding;

use App\Exceptions\ApplicationException;
use App\Models\Bio;
use App\Models\User;
use App\Repositories\BioRepository;
use App\Services\BioFactory;
use App\Services\PlanGate;
use App\Services\SlugService;
use Illuminate\Support\Str;

/**
 * Cria a primeira bio do usuário (slug, layout e links iniciais).
 */
final class CompleteOnboarding
{
    public function __construct(
        private SlugService $slugs,
        private PlanGate $plans,
        private BioFactory $factory,
        private BioRepository $bios,
    ) {}

    /**
     * @param  array<string, mixed>  $config
     * @return array{ok: true, slug: string, redirect: string}
     */
    public function execute(User $user, string $slugInput, ?string $themePackId, array $config): array
    {
        if ($this->bios->existsForUser($user)) {
            throw new ApplicationException('Você já tem uma bio.', 422);
        }

        $slug = $this->slugs->normalize($slugInput);
        $error = $this->slugs->validate($slug);
        if ($error !== null) {
            throw new ApplicationException($error, 422);
        }
        if ($this->bios->slugExists($slug)) {
            throw new ApplicationException('Este slug já está em uso.', 422);
        }

        if (! is_array($config['brand'] ?? null)) {
            $config = $this->factory->make($user->name);
        }

        $attributes = [
            'slug' => $slug,
            'plan' => 'free',
            'status' => 'active',
            'theme_pack_id' => $themePackId,
            'analytics_key' => (string) Str::uuid(),
            'json_draft' => $config,
            'json_published' => $config,
        ];

        $bio = new Bio($attributes);
        $this->plans->assertCanSave($bio, $config);
        $this->bios->createForUser($user, $attributes);

        return [
            'ok' => true,
            'slug' => $slug,
            'redirect' => '/app',
        ];
    }
}
