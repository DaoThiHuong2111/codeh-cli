# File này define logic chi tiết về các chức năng configs của application

## Chuẩn bị

bạn đang tạo và sử dụng 1 file env cũng như các biến trong env rất không đồng nhất, tôi muốn bạn clean và quy lại về các biến env sau:

- CODEH_MODEL
- CODEH_BASE_URL
- CODEH_API_KEY
- CODEH_PROVIDER
- CODEH_MAX_TOKEN

## Flow check logic configs sẽ như sau

1. ưu tiên kiểm tra trước các biến được setting trong env bao gồm
   - CODEH_MODEL
   - CODEH_BASE_URL
   - CODEH_API_KEY
   - CODEH_PROVIDER
   - CODEH_MAX_TOKEN
2. nếu kiểm tra không có các biến trong mục 1 thì sẽ check tiếp tại file configs theo đường dẫn ~/.codeh/configs.json
3. sau 2 bước 1 và 2, nếu không tìm thấy cả env và file config thì sẽ cho là chưa được config và sẽ được redirect đến màn hình configs
   4, nếu sau 2 bước 1 và 2, nếu tìm thấy cả env và file config thì sẽ ưu tiên sử dụng giá trị trong env
4. sau khi kiểm tra xong thì sẽ redirect đến màn hình Home screen

## Các màn hình configs sẽ được implement với logic và ui như sau

1. Configs screen 1, nhiêm vụ của màn dầu tiên này là lựa chọn providerp, nó sẽ - có ui hiển thị như sau

Select your provider:

1. anthropic
2. openai
3. generic-chat-completion-api

↑/↓ choose ⚈ enter accept ⚈ ctrl + c to exit

- có logic cần implement như sau
  - khi người dùng chọn 1 provider thì sẽ tạm lưu vào 1 state để chuyển đến màn hình Configs screen 2
  - người dùng sử dụng các mũi tên lên xuống để chọn các option, các option khi người dùng di chuyển sẽ được highlight với text color màu xanh lá cây
  - người dùng sử dụng enter để chọn option và redriect đến màn hình Configs screen 2
  - người dùng có thể sử dụng ctrl + c tại đây để kết thúc toàn bộ chương trình

2. Configs screen 2, nhiêm vụ của màn dầu tiên này là lựa chọn model, nó sẽ có ui hiển thị như sau

Enter your model:
**ô input text có hint là: Enter your model...**

esc back ⚈ ctrl + c to exit

- có logic cần implement như sau
  - khi người dùng nhập vào ô input text thì sẽ tạm lưu vào 1 state để chuyển đến màn hình Configs screen 3
  - người dùng sử dụng esc để quay lại màn hình Configs screen 1
  - người dùng có thể sử dụng ctrl + c tại đây để kết thúc toàn bộ chương trình

3. Configs screen 3, nhiêm vụ của màn dầu tiên này là lựa chọn base url, nó sẽ có ui hiển thị như sau

Enter your base url:
**ô input text có hint là: Enter your base url...**

esc back ⚈ ctrl + c to exit

- có logic cần implement như sau
  - khi người dùng nhập vào ô input text thì sẽ tạm lưu vào 1 state để chuyển đến màn hình Configs screen 4
  - người dùng sử dụng esc để quay lại màn hình Configs screen 2
  - người dùng có thể sử dụng ctrl + c tại đây để kết thúc toàn bộ chương trình

4. Configs screen 4, nhiêm vụ của màn dầu tiên này là lựa chọn api key, nó sẽ có ui hiển thị như sau

Enter your api key:
**ô input text có hint là: Enter your api key...**

this will be written to the global configuration file: ~/.codeh/configs.json

esc back ⚈ ctrl + c to exit

- có logic cần implement như sau
  - khi người dùng nhập vào ô input text thì sẽ lưu toàn bộ state ở các màn trước lấy được và màn này vào file configs.json tại đường dẫn ~/.codeh/configs.json vói format như sau:
    {
    "custom_models": [
    {
    "provider": "your_provider",
    "model": "your_model",
    "base_url": "your_base_url",
    "api_key": "your_api_key"
    }
    ]
    }
  - sau khi lưu xong thì sẽ redirect đến màn hình Home screen
  - người dùng sử dụng esc để quay lại màn hình Configs screen 3
  - người dùng có thể sử dụng ctrl + c tại đây để kết thúc toàn bộ chương trình
