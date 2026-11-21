
-- KEYS: danh sách Redis key của các ghế
-- ARGV[1]: customerId
-- ARGV[2]: thời gian giữ ghế (giây)

local customerId = ARGV[1]
local ttl = tonumber(ARGV[2])

-- Bước 1: Kiểm tra tất cả ghế
for i = 1, #KEYS do
    local currentOwner = redis.call('GET', KEYS[i])

    -- Ghế đang được khách hàng khác giữ
    if currentOwner and currentOwner ~= customerId then
        return 0
    end
end

-- Bước 2: Tất cả ghế đều có thể giữ
for i = 1, #KEYS do
    redis.call('SET', KEYS[i], customerId, 'EX', ttl)
end

return 1
