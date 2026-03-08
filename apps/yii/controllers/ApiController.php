<?php

namespace app\controllers;

use Yii;
use yii\rest\Controller;
use yii\web\Response;
use yii\web\NotFoundHttpException;
use app\models\Item;

class ApiController extends Controller
{
    public function beforeAction($action)
    {
        Yii::$app->response->format = Response::FORMAT_JSON;
        return parent::beforeAction($action);
    }

    public function actionItems()
    {
        return Item::find()->orderBy(['id' => SORT_ASC])->asArray()->all();
    }

    public function actionItem($id)
    {
        $item = Item::findOne($id);

        if (!$item) {
            throw new NotFoundHttpException('Item not found');
        }

        return $item->toArray();
    }

    public function actionCreateItem()
    {
        $item = new Item();
        $item->load(Yii::$app->request->bodyParams, '');

        if ($item->save()) {
            Yii::$app->response->statusCode = 201;
            return $item->toArray();
        }

        Yii::$app->response->statusCode = 422;
        return $item->errors;
    }

    public function actionUpdateItem($id)
    {
        $item = Item::findOne($id);

        if (!$item) {
            throw new NotFoundHttpException('Item not found');
        }

        $item->load(Yii::$app->request->bodyParams, '');

        if ($item->save()) {
            return $item->toArray();
        }

        Yii::$app->response->statusCode = 422;
        return $item->errors;
    }

    public function actionDeleteItem($id)
    {
        $item = Item::findOne($id);

        if (!$item) {
            throw new NotFoundHttpException('Item not found');
        }

        $item->delete();

        return ['message' => 'Item deleted'];
    }
}