
<section>
    <div class="container">
        <div class="row justify-content-center">
            <div class="col-12 col-lg-10"><br>
                <?php if ($useBreadCrumb) { ?>
                <div class="cmp-breadcrumbs " role="navigation">
                    <nav class="breadcrumb-container" aria-label="breadcrumb">
                        <ol class="breadcrumb p-0">
                            <li class="breadcrumb-item trail-begin">
                                <a href="<?= BASE_URL ?>">Home</a>
                            </li>
                            <li class="breadcrumb-item active">
                                <span class="separator">/
                                </span>
                            </li>
                            <li class="breadcrumb-item active">
                                <span class="separator"><?= strtoupper(str_replace('-', ' ', $service)) ?></span>
                            </li>
                        </ol>
                    </nav>
                </div><br>
                <?php } ?>
                <div id="spinnerLoadService" class="col-6 col-lg-3">
                </div>
                <h1 id="title-head-service"></h1>
                <p id="subtitle-head-service"></p>
                <div id="alertMessageService" class="alert" role="alert" style="display:none;">
                </div>
            </div> 
        </div>
    </div>
</section>
