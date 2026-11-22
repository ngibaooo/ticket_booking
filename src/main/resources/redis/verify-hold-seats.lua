-- KEYS: danh sách Redis key của các ghế
-- ARGV[1]: customerId

local customerId = ARGV[1]

-- Kiểm tra tất cả ghế có được giữ bởi customer hiện tại không
for i = 1, #KEYS do
    local currentOwner = redis.call('GET', KEYS[i])

    if currentOwner ~= customerId then
        return 0
    end
end

return 1