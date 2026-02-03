<?php

namespace app\controllers;

use Yii;
use yii\web\Controller;
use yii\web\Response;

class ApiController extends Controller
{
    public $enableCsrfValidation = false;

    public function beforeAction($action)
    {
        Yii::$app->response->format = Response::FORMAT_JSON;

        $origin = Yii::$app->request->headers->get('Origin');
        $allowed = ['http://localhost', 'http://localhost:80', 'http://bench-ui.local'];

        if ($origin && in_array($origin, $allowed, true)) {
            $h = Yii::$app->response->headers;
            $h->set('Access-Control-Allow-Origin', $origin);
            $h->set('Vary', 'Origin');
            $h->set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
            $h->set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        }

        if (Yii::$app->request->isOptions) {
            Yii::$app->response->statusCode = 204;
            return false;
        }

        return parent::beforeAction($action);
    }

    public function actionBenchPing()
    {
        return ['ok' => true];
    }

    public function actionBenchDb()
    {
        $count = (int) Yii::$app->db->createCommand('SELECT COUNT(*) FROM items')->queryScalar();
        return ['count' => $count];
    }

    public function actionItems()
    {
        $count = (int) Yii::$app->db->createCommand('SELECT COUNT(*) FROM items')->queryScalar();
        return ['count' => $count];
    }

    public function actionItem($id)
    {
        $row = Yii::$app->db->createCommand(
            'SELECT id, name, description, created_at FROM items WHERE id = :id'
        )->bindValue(':id', (int)$id)->queryOne();

        if (!$row) {
            Yii::$app->response->statusCode = 404;
            return ['error' => 'Not found'];
        }

        return ['item' => $row];
    }

    public function actionCreateItem()
    {
        $data = json_decode(Yii::$app->request->rawBody ?: '[]', true);

        $name = trim((string)($data['name'] ?? ''));
        $description = trim((string)($data['description'] ?? ''));

        if ($name === '') {
            Yii::$app->response->statusCode = 422;
            return ['error' => 'Name is required'];
        }

        Yii::$app->db->createCommand()->insert('items', [
            'name' => $name,
            'description' => $description,
        ])->execute();

        return ['id' => (int)Yii::$app->db->getLastInsertID()];
    }

    public function actionDeleteItem($id)
    {
        $affected = Yii::$app->db->createCommand()
            ->delete('items', ['id' => (int)$id])
            ->execute();

        if ($affected === 0) {
            Yii::$app->response->statusCode = 404;
            return ['error' => 'Not found'];
        }

        return ['deleted' => true];
    }
}
