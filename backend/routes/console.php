<?php

use App\Jobs\AggregateToolCallStatsJob;
use App\Jobs\CheckErrorRateJob;
use Illuminate\Support\Facades\Schedule;

Schedule::job(new AggregateToolCallStatsJob('hour'))->hourly();
Schedule::job(new AggregateToolCallStatsJob('day'))->dailyAt('00:15');
Schedule::job(new CheckErrorRateJob())->hourly();
