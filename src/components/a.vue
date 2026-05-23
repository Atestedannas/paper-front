[PHP]
;*****************************************************************;
; Laravel 11 + PHP 8.2 商城项目优化配置                          ;
;*****************************************************************;

error_reporting = E_ALL
display_errors = On
display_startup_errors = On
track_errors = Off
html_errors = On

error_prepend_string = "<font color=#ff0000>"
error_append_string = "</font>"
error_log = php_errors.log

upload_tmp_dir = /tmp
upload_max_filesize = 20M
post_max_size = 20M
max_file_uploads = 20

max_execution_time = 300
max_input_time = 300
memory_limit = 512M

register_globals = Off
magic_quotes_gpc = Off
magic_quotes_runtime = Off
magic_quotes_sybase = Off

auto_globals_jit = On

output_buffering = Off
implicit_flush = Off

allow_call_time_pass_reference = Off
short_open_tag = Off

precision = 14
y2k_compliance = On

zlib.output_compression = Off

variables_order = "GPCS"
request_order = "GP"

register_argc_argv = Off
auto_prepend_file =
auto_append_file =

disable_functions = exec,system,shell_exec,passthru
disable_classes =

ignore_user_abort = On

always_populate_raw_post_data = -1

enable_dl = Off

realpath_cache_size = 4096k
realpath_cache_ttl = 600

[Session]
session.save_handler = files
session.save_path = "/tmp"
session.use_cookies = 1
session.use_only_cookies = 1
session.name = PHPSESSID
session.auto_start = 0
session.cookie_lifetime = 0
session.cookie_path = /
session.cookie_domain =
session.cookie_httponly =
session.serialize_handler = php
session.gc_probability = 1
session.gc_divisor = 1000
session.gc_maxlifetime = 1440
session.bug_compat_42 = 0
session.bug_compat_warn = 1
session.referer_check =
session.entropy_length = 32
session.entropy_file = /dev/urandom
session.cache_limiter = nocache
session.cache_expire = 180
session.use_trans_sid = 0
session.hash_function = sha256
session.hash_bits_per_character = 5

[Assertion]
zend.assertions = -1

[Date]
date.timezone = Asia/Shanghai

[MySQLi]
mysqli.max_persistent = -1
mysqli.allow_persistent = On
mysqli.max_links = -1
mysqli.cache_size = 2000

[mysql]
mysql.cache_size = 2000

[bcmath]
bcmath.scale = 0

[Fileinfo]
fileinfo.enabled = On

[FTP]
ftp.enabled = On

[GD]
gd.jpeg_ignore_warning = 1

[Gettext]

[hash]
hash.enable = 1

[iconv]
iconv.input_encoding = UTF-8
iconv.output_encoding = UTF-8
iconv.internal_encoding = UTF-8

[intl]
intl.default_locale =
intl.error_level = 0

[ldap]
ldap.max_links = -1

[mbstring]
mbstring.language = Chinese-Simplified
mbstring.internal_encoding = UTF-8
mbstring.http_input = UTF-8
mbstring.http_output = UTF-8
mbstring.encoding_translation = On
mbstring.detect_order = auto
mbstring.substitute_character = none
mbstring.func_overload = 0

[openssl]
openssl.cafile =
openssl.capath =

[PCRE]
pcre.backtrack_limit = 1000000
pcre.recursion_limit = 1000000

[Pdo]
pdo_odbc.db2_instance_name =
pdo_odbc.connection_pooling = strict

[pdo_mysql]
pdo_mysql.cache_size = 2000
pdo_mysql.default_socket =

[pdo_sqlite]
pdo_sqlite.enable_prefetch = 1
pdo_sqlite.cache_size = 2000

[Phar]
phar.readonly = Off
phar.require_hash = Off
phar.cache_list =

[posix]
posix.enable = 1

[Program]
program.enable = 1

[pspell]

[readline]
readline.enable = 1

[recode]
recode.enable = 1

[Reflection]
reflection.enable = 1

[Shared Memory]
shmop.enable = 1

[SimpleXML]
simplexml.enable = 1
simplexml.import_request_variables = 1

[SOAP]
soap.wsdl_cache_enabled = 1
soap.wsdl_cache_dir = "/tmp"
soap.wsdl_cache_ttl = 86400
soap.wsdl_cache_limit = 5

[SPL]
spl_autoload_register = 1
spl_autoload_unregister_callback_func = 1

[SQLite]
sqlite.utf8_mode = 0

[sqlite3]
sqlite3.enable = 1
sqlite3.extension_dir =

[standard]
assert.active = 1
assert.bail = 0
assert.callback =
assert.quiet_eval = 0
assert.warning = 1
auto_detect_line_endings = 1
default_charset = UTF-8
default_mimetype = "text/html"
default_socket_timeout = 60
define_syslog_variables = Off
display_errors = On
display_startup_errors = Off
docref_root =
docref_ext =
error_reporting = E_ALL & ~E_DEPRECATED & ~E_STRICT
expose_php = Off
file_uploads = On
highlight.bg = "#ffffff"
highlight.comment = "#ff8000"
highlight.default = "#0000bb"
highlight.html = "#000000"
highlight.keyword = "#007700"
highlight.string = "#dd0000"
html_errors = Off
ignore_repeated_errors = Off
ignore_repeated_source = Off
implicit_flush = Off
include_path = ".;C:\php\pear"
log_errors = On
log_errors_max_len = 1024
magic_quotes_runtime = Off
magic_quotes_sybase = Off
max_execution_time = 300
max_file_uploads = 20
max_input_nesting_level = 64
max_input_time = 300
memory_limit = 512M
open_basedir =
output_buffering = Off
output_handler =
post_max_size = 20M
precision = 14
register_argc_argv = Off
register_globals = Off
register_long_arrays = Off
report_memleaks = On
report_zend_debug = On
request_order = "GP"
safe_mode = Off
safe_mode_gid = Off
safe_mode_include_dir =
safe_mode_exec_dir =
safe_mode_allowed_env_vars = PHP_
safe_mode_protected_env_vars = LD_LIBRARY_PATH
serialize_precision = 17
short_open_tag = Off
SMTP = localhost
smtp_port = 25
sql.safe_mode = Off
track_errors = Off
unserialize_callback_func =
upload_tmp_dir = /tmp
upload_max_filesize = 20M
user_dir =
user_ini.cache_ttl = 300
user_ini.filename = .user.ini
variables_order = "GPCS"
xmlrpc_error_number = 0
xmlrpc_errors = Off
y2k_compliance = On
zend.enable = 1
zend.multibyte = 0
zend.script_encoding =

[tidy]
tidy.clean_output = Off

[tokenizer]
tokenizer.enable = 1

[WDDX]
wddx.enable = 1

[xml]
xmlrpc_error_number = 0
xmlrpc_errors = Off

[xmlreader]
xmlreader.enable = 1

[xmlwriter]
xmlwriter.enable = 1

[xsl]
xsl.enable = 1

[Zend]
zend.enable = 1

[opcache]
opcache.enable = 1
opcache.enable_cli = 0
opcache.memory_consumption = 256
opcache.interned_strings_buffer = 32
opcache.max_accelerated_files = 20000
opcache.validate_timestamps = 1
opcache.revalidate_freq = 2
opcache.save_comments = 1
opcache.jit_buffer_size = 0
opcache.jit = 1255
opcache.file_cache =
opcache.file_cache_only = 0

[curl]
curl.cainfo =

[openssl]
openssl.cafile = "D:\phpstudy_pro\Extensions\php\cacert.pem"
openssl.capath = "D:\phpstudy_pro\Extensions\php\cacert.pem"

[mail function]
sendmail_path = "D:\phpstudy_pro\Extensions\Mail\mailutil.exe"

;*****************************************************************;
; Laravel 必需扩展（已启用）                                      ;
;*****************************************************************;

extension=bcmath
extension=curl
extension=fileinfo
extension=gd
extension=gettext
extension=intl
extension=mbstring
extension=mysqli
extension=openssl
extension=pdo_mysql
extension=Tokenizer
extension=xml
extension=ctype
extension=json
extension=phar
extension=posix
extension=readline
extension=simplexml
extension=sockets
extension=spl
extension=tokenizer
extension=xmlreader
extension=xmlwriter
extension=zip
extension=zlib

;*****************************************************************;
; Windows 扩展（使用 extension 代替 zend_extension）              ;
;*****************************************************************;

extension=php_bz2.dll
extension=php_curl.dll
extension=php_fileinfo.dll
extension=php_gd2.dll
extension=php_gettext.dll
extension=php_intl.dll
extension=php_mbstring.dll
extension=php_exif.dll
extension=php_mysqli.dll
extension=php_openssl.dll
extension=php_pdo_mysql.dll
extension=php_pdo_pgsql.dll
extension=php_pdo_sqlite.dll
extension=php_pgsql.dll
extension=php_shmop.dll
extension=php_soap.dll
extension=php_sockets.dll
extension=php_sqlite3.dll
extension=php_tidy.dll
extension=php_xmlrpc.dll
extension=php_xsl.dll
extension=php_zip.dll
