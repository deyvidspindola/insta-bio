<?php

namespace App\Console\Commands;

use App\Exceptions\ApplicationException;
use App\Repositories\UserRepository;
use App\Services\CurrentBioService;
use App\Services\MercadoPagoService;
use Illuminate\Console\Command;

/**
 * Aprova ou recusa o plano Pro no sandbox local, sem abrir o checkout.
 */
class BillingSandboxCommand extends Command
{
    protected $signature = 'billing:sandbox {email : E-mail do usuário} {--reject : Recusa o pagamento e volta ao Free}';

    protected $description = 'Simula pagamento Pro no sandbox local';

    public function __construct(
        private UserRepository $users,
        private CurrentBioService $currentBio,
        private MercadoPagoService $mercadoPago,
    ) {
        parent::__construct();
    }

    /**
     * Aplica o status de sandbox na bio do e-mail informado.
     */
    public function handle(): int
    {
        if (! $this->mercadoPago->allowsLocalSimulation()) {
            $this->error('Sandbox local só funciona fora de produção e sem token de produção.');

            return self::FAILURE;
        }

        $email = (string) $this->argument('email');
        $user = $this->users->findByEmail($email);
        if ($user === null) {
            $this->error("Usuário não encontrado: {$email}");

            return self::FAILURE;
        }

        try {
            $bio = $this->currentBio->require($user);
        } catch (ApplicationException $e) {
            $this->error($e->getMessage());

            return self::FAILURE;
        }
        $reject = (bool) $this->option('reject');
        $status = $reject ? 'rejected' : 'authorized';

        $this->mercadoPago->applyStatus($bio, $status, [
            'driver' => 'local',
            'source' => 'artisan',
        ], 'sandbox-'.$bio->id);

        $bio->refresh();
        $this->info($reject
            ? "Pagamento recusado. Plano atual: {$bio->plan}"
            : "Pagamento aprovado. Plano atual: {$bio->plan}");

        return self::SUCCESS;
    }
}
