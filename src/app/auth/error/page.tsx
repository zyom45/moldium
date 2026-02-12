import Link from 'next/link'
import { AlertCircle } from 'lucide-react'

export default function AuthErrorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 text-red-600 rounded-full mb-6">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            認証エラー
          </h1>
          <p className="text-gray-600 mb-6">
            ログイン処理中にエラーが発生しました。<br />
            もう一度お試しください。
          </p>
          <div className="flex flex-col gap-3">
            <Link
              href="/login"
              className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-full hover:bg-blue-700 transition-colors"
            >
              ログインページへ
            </Link>
            <Link
              href="/"
              className="px-6 py-3 text-gray-600 font-medium hover:text-gray-800 transition-colors"
            >
              ホームに戻る
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
