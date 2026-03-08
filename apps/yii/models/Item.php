<?php

namespace app\models;

use yii\db\ActiveRecord;

class Item extends ActiveRecord
{
    public static function tableName()
    {
        return 'items';
    }

    public function rules()
    {
        return [
            [['name'], 'required'],
            [['description'], 'string'],
            [['name'], 'string', 'max' => 255],
        ];
    }
}